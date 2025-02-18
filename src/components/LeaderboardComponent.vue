// /src/components/LeaderboardComponent.vue (Complete and Correct)
<template>
  <div class="p-4 border rounded shadow-sm bg-white">
    <h2 class="text-2xl font-weight-bold mb-4">Leaderboard</h2>
    <div v-if="loading" class="text-center">Loading...</div>
    <div v-else-if="error" class="text-danger">{{ error }}</div>
    <table v-else class="table table-striped table-bordered table-hover">
      <thead class="thead-light">
        <tr>
          <th scope="col" class="px-6 py-3 text-left text-xs font-weight-bold text-gray-500 uppercase">
            Model
          </th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-weight-bold text-gray-500 uppercase">
            Average Rating
          </th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-weight-bold text-gray-500 uppercase">
            Total Ratings
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="model in leaderboardData" :key="model.id">
          <td class="px-6 py-4 whitespace-nowrap">
            {{ model.id }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            {{ model.averageRating.toFixed(2) }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            {{ model.count }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { db } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default {
  name: 'LeaderboardComponent',
  data() {
    return {
      leaderboardData: [],
      loading: true,
      error: null,
    };
  },
  async created() {
    try {
      const querySnapshot = await getDocs(collection(db, 'modelRatings'));
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const totalScore = data.contentAccuracy + data.formatting + data.relevance + data.overallQuality;
        const averageRating = data.count > 0 ? totalScore / (data.count * 4) * 5 : 0; //4 categories
        this.leaderboardData.push({
          id: doc.id,
          averageRating,
          count: data.count
        });
      });
      // Sort by average rating (descending)
      this.leaderboardData.sort((a, b) => b.averageRating - a.averageRating);
    } catch (error) {
      console.error("Error fetching leaderboard data:", error);
      this.error = "Failed to load leaderboard data.";
    } finally {
      this.loading = false;
    }
  },
};
</script>