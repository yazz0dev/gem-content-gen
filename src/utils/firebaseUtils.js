import { db } from '@/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, increment, runTransaction  } from 'firebase/firestore';

async function isAdmin(userId) {
    try {
        const adminDocRef = doc(db, "admins", userId);
        const adminDocSnap = await getDoc(adminDocRef);
        return adminDocSnap.exists();
    } catch (error) {
        console.error("Error checking admin status:", error);
        //  Treat errors as non-admin for security.
        return false;
    }
}

async function canGenerateResume(userId) {
    if (await isAdmin(userId)) {
        return true; // Admins bypass the limit
    }

    const userDocRef = doc(db, "users", userId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const lastGeneration = userData.lastGenerationDate;
        const generationCount = userData.generationCount || 0; // Get the count, default to 0

        if (!lastGeneration) {
          return true;
        }


        const now = new Date();
        const last = new Date(lastGeneration);
        const diffInMilliseconds = now - last;
        const diffInHours = diffInMilliseconds / (1000 * 60 * 60);

        if (diffInHours >= 24) {
            return true; // Allow generation, it's been 24 hours.
        } else {
            // Check if the user has exceeded the daily limit (even within 24 hours)
            return generationCount < 1; // Limit to 1 generation per day
        }

    } else {
        return true; // New user, allow generation
    }
}

// Use Transaction For updating
async function updateLastGenerationDate(userId) {
  const userDocRef = doc(db, "users", userId);
  const now = new Date();

  try {
    await runTransaction(db, async (transaction) => {
      const userDocSnap = await transaction.get(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const lastGeneration = userData.lastGenerationDate;
        let generationCount = userData.generationCount || 0;

        if (lastGeneration) {
          const last = new Date(lastGeneration);
          const diffInMilliseconds = now - last;
          const diffInHours = diffInMilliseconds / (1000 * 60 * 60);

          if (diffInHours >= 24) {
            generationCount = 1; // Reset count
          } else {
            generationCount = increment(1); // Increment
          }
        } else {
            generationCount = 1;
        }
         transaction.set(userDocRef, {
            lastGenerationDate: now.getTime(),
            generationCount: generationCount,
          }, { merge: true }); // Use set with merge

      } else {
        // First Time
        transaction.set(userDocRef, {
          lastGenerationDate: now.getTime(),
          generationCount: 1,
        });
      }
    });
  } catch (error) {
    console.error("Error updating last generation date:", error);
    throw new Error("Failed to update generation date. Please try again.");
  }
}


async function submitModelRating(modelName, ratings)
{
    try {
        const modelRef = doc(db, 'modelRatings', modelName);
        const modelDoc = await getDoc(modelRef);

        if (modelDoc.exists()) {
            await updateDoc(modelRef, {
                contentAccuracy: increment(ratings.contentAccuracy),
                formatting: increment(ratings.formatting),
                relevance: increment(ratings.relevance),
                overallQuality: increment(ratings.overallQuality),
                count: increment(1),
            });
        } else {
            await setDoc(modelRef, {
                contentAccuracy: ratings.contentAccuracy,
                formatting: ratings.formatting,
                relevance: ratings.relevance,
                overallQuality: ratings.overallQuality,
                count: 1,
            });
        }
    } catch (error) {
        console.error("Error submitting rating:", error);
        throw new Error('Failed to submit rating. Please try again.'); // Consistent error handling
    }
}



async function fetchLeaderboardData() {
  try {
    const leaderboardData = [];
    const querySnapshot = await getDocs(collection(db, 'modelRatings'));

    for (const docSnapshot of querySnapshot.docs) {
      const modelId = docSnapshot.id;
      // Only include specific models
      if (['gemini-2.0-pro-exp-02-05', 'gemini-2.0-flash-thinking-exp-01-21', 'gemini-2.0-flash', 'gemini-2.0-flash-lite-preview-02-05'].includes(modelId)) {
        const data = docSnapshot.data();
        const totalScore = data.contentAccuracy + data.formatting + data.relevance + data.overallQuality;
        const averageRating = data.count > 0 ? totalScore / (data.count * 4) * 5 : 0;

        // Fetch additional data (RPM, TPM, isAvailable) - Assuming they are in modelRateLimits
        const rateLimitRef = doc(db, 'modelRateLimits', modelId);
        const rateLimitDoc = await getDoc(rateLimitRef);
        let rpm = 0;
        let tpm = 0;
        let isAvailable = false;

        if (rateLimitDoc.exists()) {
          const rateLimitData = rateLimitDoc.data();
          rpm = rateLimitData.rpm || 0; // Provide default values
          tpm = rateLimitData.tpm || 0;
          isAvailable = rateLimitData.isAvailable !== undefined ? rateLimitData.isAvailable : false; //default

        }


        leaderboardData.push({
          id: modelId,
          averageRating,
          count: data.count,
          rpm,  // Add RPM
          tpm,  // Add TPM
          isAvailable //Add available
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
async function fetchModelRateLimits() {
  try {
      const rateLimits = {};
      const querySnapshot = await getDocs(collection(db, 'modelRateLimits'));
      querySnapshot.forEach((doc) => {
          rateLimits[doc.id] = doc.data();
      });
      return rateLimits;
  } catch (error) {
      console.error("Error fetching model rate limits:", error);
      throw new Error("Failed to load model rate limits."); // Consistent error handling
  }
}


// Use Transaction
export const checkModelRateLimit = async (modelName) => {
  const rateLimitRef = doc(db, 'modelRateLimits', modelName);

  try {
    return await runTransaction(db, async (transaction) => {
      const rateLimitDoc = await transaction.get(rateLimitRef);

      if (!rateLimitDoc.exists()) {
        return false; // Not rate limited if no doc
      }

      const { lastReset, requestCount, maxRequests } = rateLimitDoc.data();
      const now = new Date().getTime();
      const resetWindow = 1000 * 60 * 60; // 1 hour

      if (now - lastReset > resetWindow) {
        // Reset
        transaction.update(rateLimitRef, {
          requestCount: 0,
          lastReset: now,
        });
        return false; // Not rate limited
      }

      if (requestCount >= maxRequests) {
        return true; // Rate limited
      }

      // Increment request count within the transaction
      transaction.update(rateLimitRef, {
        requestCount: increment(1),
      });

      return false; // Not rate limited (yet)
    });
  } catch (error) {
    console.error('Error checking model rate limit:', error);
    return false; // Default to not rate limited on error
  }
};

export { isAdmin, canGenerateResume, updateLastGenerationDate, submitModelRating, fetchLeaderboardData, fetchModelRateLimits };