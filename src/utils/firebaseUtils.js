// src/utils/firebaseUtils.js
import { db } from '@/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, increment, serverTimestamp, runTransaction } from 'firebase/firestore';
import { MODEL_LIMITS } from './constants';
import { getUserRole } from './auth';

/**
 * @description Checks if the user can generate a resume based on their role and usage limits.
 * Admins bypass all limits. Free users have a daily limit. Paid users have credit limits.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<boolean>} - True if the user can generate, false otherwise.
 * @throws {Error} - If there is an error checking the generation limit.
 */
export async function canGenerateResume(userId) {
    try {
        // Get user document directly first
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            console.warn(`User document not found for userId: ${userId}. Allowing generation (first-time user).`);
            return true; // First time user, allow generation
        }

        const userData = userDoc.data();
        const userRole = userData.role;

        // Admins can always generate.
        if (userRole === 'admin') {
            console.log(`User ${userId} is an admin. Generation allowed.`);
            return true;
        }

        //Handle free user limits.
        if (userRole === 'user') {
            const lastGeneration = userData.lastGenerationDate;

            // Check if lastGenerationDate exists and is a Timestamp object
            if (!lastGeneration || typeof lastGeneration.toDate !== 'function') {
                console.warn(`User ${userId} has no valid lastGenerationDate. Allowing generation.`);
                return true;
            }

            const lastGenerationDate = lastGeneration.toDate();
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const lastDate = new Date(lastGenerationDate.getFullYear(), lastGenerationDate.getMonth(), lastGenerationDate.getDate());

            const canGenerate = lastDate < today;
            if (!canGenerate) {
                console.log(`User ${userId} has reached their daily generation limit.`);
            }
            return canGenerate;
        }

        // Handle paid user credit limits.
        if (userRole === 'paid user') {
            const hasCredits = userData.credits > 0;
            if (!hasCredits) {
                console.log(`User ${userId} has insufficient credits to generate.`);
            }
            return hasCredits;
        }

        // Default: If user has no role, do not allow generation
        console.warn(`User ${userId} has an unknown role (${userRole}). Generation not allowed.`);
        return false;

    } catch (error) {
        console.error('Error checking generation limit:', error);
        throw new Error(`Unable to check generation limit: ${error.message}`);
    }
}

/**
 * @description Updates user generation data (lastGenerationDate or credits) and model statistics.
 * This operation is performed in a Firestore transaction to ensure data consistency.
 * @param {string} userId - The ID of the user.
 * @param {string} selectedModel - The name of the model used for generation.
 * @returns {Promise<void>}
 * @throws {Error} - If there is an error updating the generation data.
 */
export async function updateGenerationData(userId, selectedModel) {
    try {
        const userRole = await getUserRole(userId);
        const userRef = doc(db, 'users', userId);
        const modelRef = doc(db, 'modelRateLimits', selectedModel);

        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            const modelDoc = await transaction.get(modelRef);

            if (!userDoc.exists()) {
                throw new Error("User document does not exist.");
            }
            if (!modelDoc.exists()) {
                throw new Error(`Model document for ${selectedModel} does not exist`);
            }

            const userData = userDoc.data();

            // --- USER-SPECIFIC UPDATES (Conditional) ---
            if (userRole === 'admin') {
                // ADMIN:  Do *NOT* update lastGenerationDate or credits.
                console.log(`Admin user ${userId} - skipping user-specific updates.`);
            } else if (userRole === 'user') {
                // FREE USER: Update lastGenerationDate.
                console.log(`Free user ${userId} - updating last generation date.`);
                transaction.set(userRef, { lastGenerationDate: serverTimestamp() }, { merge: true });
            } else if (userRole === 'paid user') {
                // PAID USER: Decrement credits.
                if (userData.credits <= 0) {
                    throw new Error("Insufficient credits.");
                }
                console.log(`Paid user ${userId} - decrementing credits.`);
                transaction.update(userRef, { credits: increment(-1) });
            } else {
                 throw new Error(`Unknown user role ${userRole} - cannot update.`);
            }

            // --- MODEL UPDATES (Always) ---
            // Model updates *always* happen, regardless of user role.
            console.log(`Updating model ${selectedModel} RPM.`);
            transaction.update(modelRef, { rpm: increment(1) });

        }); // End of transaction

    } catch (error) {
        console.error('Error updating generation data:', error);
        throw new Error(`Unable to update generation data: ${error.message}`);
    }
}

/**
 * @description Submits a model rating to Firestore.
 * @param {string} modelName - The name of the model.
 * @param {object} ratings - The rating object {contentAccuracy, formatting, overallQuality}.
 * @returns {Promise<void>}
 * @throws {Error} - If there is an error submitting the rating.
 */
export async function submitModelRating(modelName, ratings) {
    try {
        const modelRef = doc(db, 'modelRateLimits', modelName);

        await updateDoc(modelRef, {
            contentAccuracy: increment(ratings.contentAccuracy),
            formatting: increment(ratings.formatting),
            overallQuality: increment(ratings.overallQuality),
            count: increment(1),
        });

        console.log(`Successfully submitted rating for model: ${modelName}`);

    } catch (error) {
        console.error("Error submitting rating:", error);
        throw new Error(`Failed to submit rating. Please try again: ${error.message}`);
    }
}

/**
 * @description Fetches leaderboard data from Firestore.
 * Filters and sorts the data by average rating.
 * @returns {Promise<Array>} - An array of leaderboard entries.
 * @throws {Error} - If there is an error fetching the leaderboard data.
 */
export async function fetchLeaderboardData() {
    try {
        const leaderboardData = [];
        const querySnapshot = await getDocs(collection(db, 'modelRateLimits'));

        for (const docSnapshot of querySnapshot.docs) {
            const modelId = docSnapshot.id;

            // Only include specific models in the leaderboard
            if (['gemini-2.0-pro-exp-02-05', 'gemini-2.0-flash-thinking-exp-01-21', 'gemini-2.0-flash', 'gemini-2.0-flash-lite-preview-02-05'].includes(modelId)) {
                const data = docSnapshot.data();
                const {
                    contentAccuracy = 0,
                    formatting = 0,
                    overallQuality = 0,
                    count = 0,
                    rpm = 0, // Get rpm directly
                    tpm = 0, // and tpm
                    rpd = 0, // and rpd.
                } = data;

                const totalScore = contentAccuracy + formatting + overallQuality;
                const averageRating = count > 0 ? (totalScore / (count * 3)) * 5 : 0;

                // Determine availability based on rate limits
                const modelLimits = MODEL_LIMITS[modelId] || {};
                const isModelAvailable = !((rpm >= modelLimits.rpm) || (tpm >= modelLimits.tpm) || (rpd >= modelLimits.rpd));

                leaderboardData.push({
                    id: modelId,
                    averageRating,
                    count,
                    rpm: rpm,
                    tpm: tpm,
                    rpd: rpd,
                    isAvailable: isModelAvailable,
                });
            }
        }

        leaderboardData.sort((a, b) => b.averageRating - a.averageRating);
        return leaderboardData;
    } catch (error) {
        console.error("Error fetching leaderboard data:", error);
        throw new Error(`Failed to load leaderboard data: ${error.message}`);
    }
}

/**
 * @description Checks if a model's rate limit has been reached.
 * Admins bypass rate limits.
 * @param {string} modelName - The name of the model.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<boolean>} - True if the rate limit has been reached, false otherwise.
 * @throws {Error} - If there is an error checking the model rate limit.
 */
export const checkModelRateLimit = async (modelName, userId) => {
    try{
    const userRole = await getUserRole(userId);
    if (userRole === 'admin') {
        console.log(`Admin user ${userId} - bypassing model rate limits.`);
        return false; // Admins bypass rate limits
    }

    //  Fetch *current* rate limit data from Firestore.
    const modelRef = doc(db, 'modelRateLimits', modelName);
    const modelDoc = await getDoc(modelRef);

    if (!modelDoc.exists()) {
        console.warn(`Model data not found for ${modelName}. Assuming not limited.`);
        return false; // If no data, assume not limited (or handle as you see fit)
    }

    const modelData = modelDoc.data();
    const modelLimits = MODEL_LIMITS[modelName];
      if (!modelLimits) {
        console.warn(`Model limits not defined for ${modelName}. Assuming not limited.`);
        return false;
      }

    const { rpm, tpm, rpd } = modelLimits;
     const { rpm: currentRPM, tpm: currentTPM, rpd: currentRPD } = modelData; // Use names consistent with DB
    const isLimited = currentRPM >= rpm || currentTPM >= tpm || currentRPD >= rpd;
        if (isLimited) {
            console.log(`Model ${modelName} has reached its rate limit.`);
        }
        return isLimited;
    } catch(error){
        console.error(`Error checking model rate limits: ${error.message}`);
        throw new Error(`Error checking model rate limits: ${error.message}`);
    }
};

export {  };
