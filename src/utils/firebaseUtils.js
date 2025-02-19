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
//Other Functions Remains same
async function updateLastGenerationDate(userId) {
    const userDocRef = doc(db, "users", userId);
    const userDocSnap = await getDoc(userDocRef);
    const now = new Date();

    if (userDocSnap.exists()) {
         const userData = userDocSnap.data();
        const lastGeneration = userData.lastGenerationDate;
        const generationCount = userData.generationCount || 0; // Ensure we have a count


        const last = new Date(lastGeneration);
        const diffInMilliseconds = now - last;
        const diffInHours = diffInMilliseconds / (1000 * 60 * 60);

        //Crucial Logic
        if (diffInHours >= 24) {
            // Reset the count if it's been more than 24 hours
            await updateDoc(userDocRef, {
                lastGenerationDate: now.getTime(),
                generationCount: 1,  // Reset to 1
            });
        } else {
              // Increment the count if within the 24-hour window
              await updateDoc(userDocRef, {
                lastGenerationDate: now.getTime(), // Still update the timestamp
                generationCount: increment(1), // Increment the count.
            });
        }
    } else {
      //This Case Shouldn't happen with the try catch block in Signup
        await setDoc(userDocRef, {
            lastGenerationDate: now.getTime(),
            generationCount: 1, // Start at 1 for new users
        });
    }
}


async function submitModelRating(modelName, ratings) {
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
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const totalScore = data.contentAccuracy + data.formatting + data.relevance + data.overallQuality;
            const averageRating = data.count > 0 ? totalScore / (data.count * 4) * 5 : 0;
            leaderboardData.push({
                id: doc.id,
                averageRating,
                count: data.count
            });
        });
        leaderboardData.sort((a, b) => b.averageRating - a.averageRating);
        return leaderboardData;
    } catch (error) {
        console.error("Error fetching leaderboard data:", error);
        throw new Error("Failed to load leaderboard data."); // Consistent error handling
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


export const checkModelRateLimit = async (modelName) => {
  try {
    const rateLimitRef = doc(db, 'modelRateLimits', modelName);
    const rateLimitDoc = await getDoc(rateLimitRef);

    if (!rateLimitDoc.exists()) {
      return false; // If no rate limit document exists, assume not rate limited
    }

    const { lastReset, requestCount, maxRequests } = rateLimitDoc.data();
    const now = new Date().getTime();
    const resetWindow = 1000 * 60 * 60; // 1 hour in milliseconds

    // If the window has expired, return false (not rate limited)
    if (now - lastReset > resetWindow) {
      return false;
    }

    // Return true if rate limited, false otherwise
    return requestCount >= maxRequests;
  } catch (error) {
    console.error('Error checking model rate limit:', error);
    return false; // Default to not rate limited on error
  }
};

export { isAdmin, canGenerateResume, updateLastGenerationDate, submitModelRating, fetchLeaderboardData, fetchModelRateLimits };