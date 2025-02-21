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
          <th scope="col" class="px-6 py-3 text-left text-xs font-weight-bold text-gray-500 uppercase">
            RPM
          </th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-weight-bold text-gray-500 uppercase">
            TPM
          </th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-weight-bold text-gray-500 uppercase">
            Available
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
           <td class="px-6 py-4 whitespace-nowrap">
            {{ model.rpm }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            {{ model.tpm }}
          </td>
           <td class="px-6 py-4 whitespace-nowrap">
            {{ model.isAvailable ? 'Yes' : 'No' }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { fetchLeaderboardData } from '@/utils/firebaseUtils';

export default {
  name: 'LeaderboardComponent',
  setup() {
    const leaderboardData = ref([]);
    const loading = ref(true);
    const error = ref(null);

    onMounted(async () => {
      try {
        leaderboardData.value = await fetchLeaderboardData();
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    });

    return { leaderboardData, loading, error };
  }
};
</script>