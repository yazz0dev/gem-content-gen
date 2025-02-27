// src/composables/useFirebase.js (Reusable Firebase logic)

import { db } from '@/api/firebase.js';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, increment, serverTimestamp, runTransaction } from 'firebase/firestore';
import { MODEL_LIMITS } from '@/utils/constants';
import { getUserRole } from '@/utils/auth';
import { Timestamp } from 'firebase/firestore';

// Add retry logic for Firebase operations
const retryOperation = async (operation, maxRetries = 3) => {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
    }
    throw lastError;
};

export function useFirebase() {
    const updateGenerationData = async (userId, selectedModel) => {
        return retryOperation(async () => {
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
        });
    };

    return { updateGenerationData };
}

//Separate function to check can user generate resume.
export const canGenerateResume = async (userId) => {
    return retryOperation(async () => {
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
    });
};

//Separate function to fetch leaderboard.
export const fetchLeaderboardData = async () => {
    return retryOperation(async () => {
        try {
            const modelRateLimitsRef = collection(db, 'modelRateLimits');
            const querySnapshot = await getDocs(modelRateLimitsRef);
            const leaderboardData = [];

            for (const docSnapshot of querySnapshot.docs) {
                const modelData = docSnapshot.data();
                const modelId = docSnapshot.id;

                // Calculate the average rating
                let averageRating = 0;
                if (modelData.count > 0) {
                    const totalRating = modelData.contentAccuracy + modelData.formatting + modelData.overallQuality;
                    averageRating = totalRating / (modelData.count * 3); // Divide by total possible rating count
                }

                leaderboardData.push({
                    id: modelId,
                    averageRating: averageRating,
                    count: modelData.count,
                    rpm: modelData.rpm || 0,
                    tpm: modelData.tpm || 0,
                    rpd: modelData.rpd || 0,
                });
            }

            return leaderboardData;
        } catch (error) {
            console.error('Error fetching leaderboard data:', error);
            throw new Error('Failed to fetch leaderboard data');
        }
    });
};

export const submitModelRating = async (modelName, ratings) => {
    return retryOperation(async () => {
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
    });
};

export const checkModelRateLimit = async (modelName, userId) => {
    return retryOperation(async () => {
        try {
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
        } catch (error) {
            console.error(`Error checking model rate limits: ${error.message}`);
            throw new Error(`Error checking model rate limits: ${error.message}`);
        }
    });
};