<template>
    <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
      <div class="container py-2">
        <RouterLink to="/" class="navbar-brand d-flex align-items-center">
          <i class="bi bi-code-slash me-2"></i>
          <span>Content Builder</span>
        </RouterLink>
  
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
                aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
  
        <div class="collapse navbar-collapse justify-content-end" id="navbarNav">
          <ul class="navbar-nav align-items-center">
            <li class="nav-item" v-if="user">
              <RouterLink to="/generate" class="nav-link">Generate</RouterLink>
            </li>
            <li class="nav-item" v-if="user">
              <RouterLink to="/leaderboard" class="nav-link">Leaderboard</RouterLink>
            </li>
            <li class="nav-item">
              <RouterLink to="/pricing" class="nav-link">Pricing</RouterLink>
            </li>
            <li class="nav-item" v-if="user">
              <button @click="handleSignOut" class="btn btn-link nav-link">Sign Out</button>
            </li>
             <li class="nav-item" v-if="!user">
               <RouterLink to="/auth" class="btn btn-primary">Sign In</RouterLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  </template>
  
  <script>
  import { RouterLink } from 'vue-router';
  import { auth } from '@/api/firebase';
  import { signOutUser } from '@/utils/auth';
  import { ref, onMounted } from 'vue';
  import { useNotifications } from '@/composables/useNotification'; // Import useNotifications
  
  export default {
    name: 'AppHeader',
    components: {
      RouterLink,
    },
    setup() {
      const user = ref(null);
      const { showNotification } = useNotifications(); // Get showNotification
  
      onMounted(() => {
        auth.onAuthStateChanged((currentUser) => {
          user.value = currentUser;
        });
      });
  
      const handleSignOut = async () => {
        try {
          await signOutUser();
          showNotification('Successfully signed out', 'success'); // Use showNotification
        } catch (error) {
          console.error('Sign out error:', error);
          showNotification('Failed to sign out. Please try again.', 'error'); // Use showNotification
        }
      };
      return { user, handleSignOut };
    }
  };
  </script>
  
<style scoped>
.navbar {
  /* Consistent padding with variables */
  padding-top: var(--spacing-sm);
  padding-bottom: var(--spacing-sm);
}

.navbar-brand {
  font-size: 1.5rem; /* Slightly larger font size */
  font-weight: 600; /* Bolder font weight */
  color: var(--primary-color); /* Use primary color */
  text-decoration: none; /* Remove underline */
}

.navbar-brand i {
  color: var(--primary-color); /* Icon color */
}

.nav-link {
  color: var(--text-primary); /* Use text-primary for links */
  transition: color 0.2s ease; /* Smooth color transition */
}

.nav-link:hover {
  color: var(--primary-hover); /* Use primary-hover on hover */
}

/* Style the "Sign In" button as a primary button */
.btn-primary {
    background: var(--primary-color);
    border: none;
    box-shadow: var(--shadow-md);
    color: white;
    padding: var(--spacing-xs) var(--spacing-md); /* Adjusted padding for mobile */
    border-radius: var(--border-radius-md);
    transition: all 0.2s ease;
    font-size: 1rem; /* Consistent font size */
}

.btn-primary:hover:not(:disabled) {
    background: var(--primary-hover);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

/* Style the "Sign Out" button as a link */
.btn-link {
  color: var(--text-primary);
  text-decoration: none;
  padding: var(--spacing-xs) var(--spacing-md); /* Adjusted padding for mobile */
}
.btn-link:hover{
   color: var(--primary-hover);
}

/* Mobile Styles */
@media (max-width: 767px) {
  .navbar-nav {
    width: 100%; /* Full width on mobile */
    padding-top: var(--spacing-sm); /* Add some padding */
  }

  .nav-item {
    width: 100%; /* Full width items */
    text-align: center; /* Center align text */
  }
}
 .global-error{
    position: fixed;
    top: 1rem;
    left: 1rem;
    right: 1rem;
    z-index: 10000;
  }
</style>
