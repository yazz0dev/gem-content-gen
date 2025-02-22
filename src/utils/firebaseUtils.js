// src/utils/firebaseUtils.js
import { db } from '@/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, increment, serverTimestamp  } from 'firebase/firestore';
import { MODEL_LIMITS } from './constants';

// Checks if the user can generate (daily limit), BYPASSES for admins
export async function canGenerateResume(userId) {
  try {
    // Admin check first - if admin, always return true
    if (userId && ['uid'].includes(userId)) {
      return true;
    }

    // For non-admins, check generation limit
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return true; // First time user, allow generation
    }

    const userData = userDoc.data();
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
  } catch (error) {
    console.error('Error checking generation limit:', error);
    throw new Error('Unable to check generation limit. Please try again.');
  }
}

// Updates the user's last generation date (ONLY for non-admins)
export async function updateLastGenerationDate(userId) {
  // Skip update for admins
  if (userId && ['uid'].includes(userId)) {
    return;
  }

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
          count = 0
        } = data;

        const totalScore = contentAccuracy + formatting + overallQuality;
        const averageRating = count > 0 ? (totalScore / (count * 3)) * 5 : 0;

        // Get current usage from localStorage
        const { currentRPM, currentTPM, currentRPD } = getModelUsage(modelId);

        // Determine availability based on rate limits
        const modelLimits = MODEL_LIMITS[modelId] || {};
        const isModelAvailable = !((currentRPM >= modelLimits.rpm) || (currentTPM >= modelLimits.tpm) || (currentRPD >= modelLimits.rpd));

        leaderboardData.push({
          id: modelId,
          averageRating,
          count,
          rpm: currentRPM,
          tpm: currentTPM,
          rpd: currentRPD,
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

// --- Client-Side Rate Limiting (Modified for Admin Bypass) ---

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

// NO ADMIN CHECK HERE.  Admin check is done in checkModelRateLimit.
function updateModelUsage(modelName, tokensUsed) {
    const usage = getModelUsage(modelName);
    usage.currentRPM += 1;
    usage.currentTPM += tokensUsed;
    usage.currentRPD += 1;
    localStorage.setItem(`modelUsage_${modelName}`, JSON.stringify(usage));
}

// checkModelRateLimit now properly checks for admin
export const checkModelRateLimit = async (modelName, userId) => {
  // Admin bypass - if admin, return false (not rate limited)
  if (userId && ['uid'].includes(userId)) {
    return false;
  }

  const modelLimits = MODEL_LIMITS[modelName];
  if (!modelLimits) {
    return false;
  }

  const { rpm, tpm, rpd } = modelLimits;
  const { currentRPM, currentTPM, currentRPD } = getModelUsage(modelName);
  return currentRPM >= rpm || currentTPM >= tpm || currentRPD >= rpd;
};

export { submitModelRating, fetchLeaderboardData, updateModelUsage };