// src/utils/firebaseUtils.js
import { db } from '@/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, increment, serverTimestamp, runTransaction  } from 'firebase/firestore';
import { MODEL_LIMITS } from './constants';
import { getUserRole } from './auth'; // Import getUserRole

// Checks if the user can generate (daily limit, credit check), BYPASSES for admins
export async function canGenerateResume(userId) {
    try {
        // Get user document directly first
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            return true; // First time user, allow generation
        }

        const userData = userDoc.data();
        
        // Check role directly from user document
        if (userData.role === 'admin') {
            return true; // Admin can always generate
        }

        // Rest of the function remains the same for non-admin users
        if (userData.role === 'user') {
            const lastGeneration = userData.lastGenerationDate;

            // Check if lastGenerationDate exists and is a Timestamp object
            if (!lastGeneration || typeof lastGeneration.toDate !== 'function') {
                return true;
            }

            const lastGenerationDate = lastGeneration.toDate();
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const lastDate = new Date(lastGenerationDate.getFullYear(), lastGenerationDate.getMonth(), lastGenerationDate.getDate());

            return lastDate < today;

        } else if (userData.role === 'paid user') { // Paid user - check credits
            return userData.credits > 0;
        } else {
            // Handle other roles, or default to no generation allowed.
            return false;
        }


    } catch (error) {
        console.error('Error checking generation limit:', error);
        throw new Error('Unable to check generation limit. Please try again.');
    }
}

// Updates the user's last generation date (ONLY for free, non-admin users) and decrements credits (for paid users)
// AND updates model statistics.  ALL IN A TRANSACTION.
export async function updateGenerationData(userId, selectedModel) {
    try {
        const userRole = await getUserRole(userId);
        const userRef = doc(db, 'users', userId);
        const modelRef = doc(db, 'modelRateLimits', selectedModel);

        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            const modelDoc = await transaction.get(modelRef); // Get model doc inside transaction

            if (!userDoc.exists()) {
                throw new Error("User document does not exist."); // Transaction will abort
            }

            const userData = userDoc.data();

            // --- USER-SPECIFIC UPDATES (Conditional) ---
            if (userRole === 'admin') {
                // ADMIN:  Do *NOT* update lastGenerationDate or credits.
            } else if (userRole === 'user') {
                // FREE USER: Update lastGenerationDate.
                transaction.set(userRef, { lastGenerationDate: serverTimestamp() }, { merge: true });
            } else if (userRole === 'paid user') {
                // PAID USER: Decrement credits.
                if (userData.credits <= 0) {
                    throw new Error("Insufficient credits."); // This will abort the transaction
                }
                transaction.update(userRef, { credits: increment(-1) });
            }
            // --- MODEL UPDATES (Always) ---
            // Model updates *always* happen, regardless of user role.
            transaction.update(modelRef, { rpm: increment(1) });


        }); // End of transaction

    } catch (error) {
        console.error('Error updating generation data:', error);
        throw new Error(`Unable to update generation data: ${error.message}`);  // More informative error.
    }
}
// Correctly submits model ratings
async function submitModelRating(modelName, ratings) {
  try {
    const modelRef = doc(db, 'modelRateLimits', modelName);

    await updateDoc(modelRef, {
      contentAccuracy: increment(ratings.contentAccuracy),
      formatting: increment(ratings.formatting),
      overallQuality: increment(ratings.overallQuality),
      count: increment(1),
    });

  } catch (error) {
    console.error("Error submitting rating:", error);
    throw new Error('Failed to submit rating. Please try again.');
  }
}

async function fetchLeaderboardData() {
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
    throw new Error("Failed to load leaderboard data.");
  }
}

// --- Client-Side Rate Limiting (Removed - Handled on Backend) ---

// checkModelRateLimit now checks user role
export const checkModelRateLimit = async (modelName, userId) => {
    const userRole = await getUserRole(userId);
    if (userRole === 'admin') {
        return false; // Admins bypass rate limits
    }

    //  Fetch *current* rate limit data from Firestore.
    const modelRef = doc(db, 'modelRateLimits', modelName);
    const modelDoc = await getDoc(modelRef);

    if (!modelDoc.exists()) {
        return false; // If no data, assume not limited (or handle as you see fit)
    }

    const modelData = modelDoc.data();
    const modelLimits = MODEL_LIMITS[modelName];
      if (!modelLimits) {
        return false;
      }

    const { rpm, tpm, rpd } = modelLimits;
     const { rpm: currentRPM, tpm: currentTPM, rpd: currentRPD } = modelData; // Use names consistent with DB
    return currentRPM >= rpm || currentTPM >= tpm || currentRPD >= rpd;
};

export { submitModelRating, fetchLeaderboardData,  };