<template>
  <div class="leaderboard-container">
    <h2 class="leaderboard-title">Model Leaderboard</h2>
    <p class="leaderboard-description">
      Performance metrics and ratings for available AI models.
    </p>

    <div v-if="loading" class="loading-indicator">Loading...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>

    <div v-else class="table-responsive">
      <table class="leaderboard-table">
        <thead>
          <tr>
            <th scope="col">Model</th>
            <th scope="col" class="text-center">Avg. Rating</th>
            <th scope="col" class="text-center">Ratings</th>
            <th scope="col" class="text-center" colspan="3">Usage</th>  <th scope="col" class="text-center">Available</th>
          </tr>
          <tr>
            <th></th>
            <th></th>
            <th></th>
            <th scope="col" class="text-center">RPM</th>
            <th scope="col" class="text-center">TPM</th>
            <th scope="col" class="text-center">RPD</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="model in leaderboardData" :key="model.id" :class="{ 'unavailable-row': !model.isAvailable }">
            <td class="model-name">
                {{ model.id }}
                <span v-if="!model.isAvailable" class="badge bg-secondary ms-2">Unavailable</span>
            </td>
            <td class="rating-cell text-center">
              <span class="rating-stars">
                <template v-for="n in 5" :key="n">
                  <i :class="getStarClass(model.averageRating, n)" class="bi bi-star-fill"></i>
                </template>
              </span>
              <span class="rating-value">{{ model.averageRating.toFixed(2) }}</span>
            </td>
            <td class="text-center">{{ model.count }}</td>
             <td class="text-center">{{ model.rpm }} / {{ getModelLimit(model.id, 'rpm') }}</td>
            <td class="text-center">{{ model.tpm }} / {{ getModelLimit(model.id, 'tpm') }}</td>
            <td class="text-center">{{ model.rpd }} / {{ getModelLimit(model.id, 'rpd') }}</td>

            <td class="text-center">
              <span v-if="model.isAvailable" class="badge bg-success">Yes</span>
              <span v-else class="badge bg-danger">No</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { fetchLeaderboardData } from '@/api/firebaseUtils';
import { MODEL_LIMITS } from '@/utils/constants'; // Import MODEL_LIMITS

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

    const getStarClass = (averageRating, starNumber) => {
        if (averageRating >= starNumber) {
            return 'star-filled'; // Or any other class for a filled star
        } else if (averageRating + 0.5 >= starNumber) {
            return 'star-half-filled'; // Optional: Class for half-filled star
        } else {
            return 'star-empty'; // Or any class for an empty star
        }
    }

      const getModelLimit = (modelId, limitType) => {
      const modelLimits = MODEL_LIMITS[modelId];
      return modelLimits ? modelLimits[limitType] : 'N/A'; // Return limit or 'N/A'
    };

    return { leaderboardData, loading, error, getStarClass, getModelLimit };
  }
};
</script>

<style scoped>
/* Overall Container */
.leaderboard-container {
  padding: var(--spacing-lg);
  background-color: var(--surface-color);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
}

.leaderboard-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: var(--spacing-xs);
  color: var(--text-primary);
}

.leaderboard-description {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-lg);
}

.loading-indicator,
.error-message {
  text-align: center;
  padding: var(--spacing-md);
  color: var(--text-secondary);
}

.error-message {
  color: var(--danger-color);
}

/* Table Styles */
.table-responsive {
  overflow-x: auto; /* Horizontal scrolling on small screens */
}

.leaderboard-table {
  width: 100%;
  border-collapse: collapse; /* Remove extra spacing between cells */
  margin-bottom: 0; /* Remove default Bootstrap table margin */
}

.leaderboard-table th,
.leaderboard-table td {
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid #dee2e6; /* Subtle border */
  vertical-align: middle; /* Vertically center content */
  text-align: center;
}

.leaderboard-table thead th {
  background-color: var(--background-color);
  color: var(--text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #dee2e6; /* Slightly thicker bottom border for header */
}

.leaderboard-table tbody tr:hover {
  background-color: #f8f9fa; /* Subtle hover effect */
}
.leaderboard-table tbody tr {
    transition: background-color 0.3s ease; /* Smooth transition for hover */
}

.model-name {
  font-weight: 500;
  color: var(--text-primary);
  text-align: left;
}

.rating-cell {
  white-space: nowrap; /* Prevent stars from wrapping */
}

.rating-stars {
  color: #ffc107; /* Bootstrap warning color (gold) */
  margin-right: var(--spacing-xs);
}
.star-filled {
    color: gold; /* Or any filled star color */
}
.star-half-filled {
    position: relative;
    display: inline-block;
    color: lightgray; /* Or any empty star color */
    overflow: hidden;
    white-space: nowrap;
}
.star-half-filled::before {
    content: '\2605'; /* Unicode for a full star */
    position: absolute;
    top: 0;
    left: 0;
    color: gold; /* Filled star color */
    width: 50%; /* Fill half of the star */
    overflow: hidden;

}

.star-empty {
    color: lightgray; /* Or any empty star color */
}

.rating-value {
  font-weight: 500;
  color: var(--text-primary);
}

.badge {
  font-size: 0.75rem; /* Smaller badge font size */
  font-weight: 500;
  padding: 0.35em 0.65em; /* Adjust padding for a tighter look */
  vertical-align: middle;
}

/* Unavailable Row Styling */
.unavailable-row {
  opacity: 0.6; /* Make unavailable rows less prominent */
}

/* Responsive Adjustments */
@media (max-width: 767px) {
  .leaderboard-table th,
  .leaderboard-table td {
    padding: var(--spacing-xs) var(--spacing-sm); /* Smaller padding on mobile */
    font-size: 0.875rem; /* Slightly smaller font size */
  }
    .rating-stars{
        display: block;
    }
}
</style>