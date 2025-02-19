import { db } from '@/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, increment, query, where } from 'firebase/firestore';

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

        if (!lastGeneration) {
            return true;
        }

        const now = new Date();
        const last = new Date(lastGeneration);
        const diffInMilliseconds = now - last;
        const diffInHours = diffInMilliseconds / (1000 * 60 * 60);

        return diffInHours >= 24;

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
        await updateDoc(userDocRef, {
            lastGenerationDate: now.getTime()
        });
    } else {
        await setDoc(userDocRef, {
            lastGenerationDate: now.getTime()
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

export { isAdmin, canGenerateResume, updateLastGenerationDate, submitModelRating, fetchLeaderboardData };
