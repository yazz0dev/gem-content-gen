import { db } from '@/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, increment, runTransaction, serverTimestamp  } from 'firebase/firestore';
import { MODEL_LIMITS } from './constants'; // Import the limits

async function isAdmin(userId) {
    try {
        const adminDocRef = doc(db, "admins", userId);
        const adminDocSnap = await getDoc(adminDocRef);
        return adminDocSnap.exists();
    } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
    }
}

export async function canGenerateResume(userId) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return true; // First time user
    }

    const userData = userDoc.data();
    const lastGeneration = userData.lastGenerationDate;

    // Check if lastGenerationDate exists and is a Timestamp object
    if (!lastGeneration || typeof lastGeneration.toDate !== 'function') {
        return true; // Treat as if the user can generate
    }

    const lastGenerationDate = lastGeneration.toDate();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastDate = new Date(lastGenerationDate.getFullYear(), lastGenerationDate.getMonth(), lastGenerationDate.getDate());

    return lastDate < today;
  } catch (error) {
    console.error('Error checking generation limit:', error);
    throw new Error('Unable to check generation limit. Please try again.');
  }
}

// Use Transaction For updating
export async function updateLastGenerationDate(userId) {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      lastGenerationDate: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error updating generation date:', error);
    throw new Error('Unable to update generation date. Please try again.');
  }
}

// Updated submitModelRating to use modelRateLimits
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

// Updated fetchLeaderboardData to get everything from modelRateLimits
async function fetchLeaderboardData() {
  try {
    const leaderboardData = [];
    const querySnapshot = await getDocs(collection(db, 'modelRateLimits'));

    for (const docSnapshot of querySnapshot.docs) {
      const modelId = docSnapshot.id;

       //Only include specific models in the leaderboard
      if (['gemini-2.0-pro-exp-02-05', 'gemini-2.0-flash-thinking-exp-01-21', 'gemini-2.0-flash', 'gemini-2.0-flash-lite-preview-02-05'].includes(modelId)) {
        const data = docSnapshot.data();
        const {
          isAvailable = false,
          contentAccuracy = 0,
          formatting = 0,
          overallQuality = 0,
          count = 0
        } = data; // Destructure *all* fields, with defaults

        const totalScore = contentAccuracy + formatting + overallQuality;
        const averageRating = count > 0 ? (totalScore / (count * 3)) * 5 : 0; // Now dividing by (count * 3)

        // Get current usage from localStorage
        const { currentRPM, currentTPM } = getModelUsage(modelId);

        leaderboardData.push({
          id: modelId,
          averageRating,
          count,
          rpm: currentRPM,  // Current usage
          tpm: currentTPM,  // Current usage
          isAvailable,
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


// --- Client-Side Rate Limiting ---

function getModelUsage(modelName) {
    const usageKey = `modelUsage_${modelName}`;
    let usage = JSON.parse(localStorage.getItem(usageKey) || '{}');

    const now = Date.now();
    const oneMinute = 60 * 1000;
    const oneDay = 24 * 60 * oneMinute;

    // Reset RPM and TPM if a minute has passed
    if (!usage.lastRPMReset || (now - usage.lastRPMReset) > oneMinute) {
        usage.currentRPM = 0;
        usage.lastRPMReset = now;
    }
    if (!usage.lastTPMReset || (now - usage.lastTPMReset) > oneMinute) {
        usage.currentTPM = 0;
        usage.lastTPMReset = now;
    }

    // Reset RPD if a day has passed
    if (!usage.lastRPDReset || (now - usage.lastRPDReset) > oneDay) {
        usage.currentRPD = 0;
        usage.lastRPDReset = now;
    }
    localStorage.setItem(usageKey, JSON.stringify(usage));
    return usage;
}

function updateModelUsage(modelName, tokensUsed) {
    const usage = getModelUsage(modelName);
    usage.currentRPM += 1;
    usage.currentTPM += tokensUsed;
    usage.currentRPD +=1;
    localStorage.setItem(`modelUsage_${modelName}`, JSON.stringify(usage));
}

// Updated checkModelRateLimit to use client-side logic
export const checkModelRateLimit = async (modelName) => {
    const modelLimits = MODEL_LIMITS[modelName];
    if (!modelLimits) {
      return false; // Model not found, not rate limited
    }

    const { rpm, tpm, rpd } = modelLimits;
    const { currentRPM, currentTPM, currentRPD } = getModelUsage(modelName);
    // console.log(currentRPM, currentTPM, currentRPD); //for debug
    if (currentRPM >= rpm || currentTPM >= tpm || currentRPD >= rpd) {
        return true; // Rate limited
    }

    return false; // Not rate limited
};

export { isAdmin, submitModelRating, fetchLeaderboardData, updateModelUsage };