// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import AuthForm from '@/components/auth/AuthForm.vue';
import LeaderboardComponent from '@/components/ui/LeaderboardComponent.vue';
import { auth } from '@/api/firebase.js';
import { getDeveloperApiKey } from '@/utils/auth.js'; // Import getDeveloperApiKey
import LoggedOutHomeView from '../views/LoggedOutHomeView.vue'; // Import new view
import GenerationView from '../views/GenerationView.vue'; // Import renamed view

// Create a simple NotFound component
const NotFound = { template: '<div>Not Found</div>' };

// Create a promise to track auth state initialization
let authInitialized = false;
const waitForAuthInit = () => {
  return new Promise(resolve => {
    if (authInitialized) {
      resolve();
    } else {
      const unsubscribe = auth.onAuthStateChanged(() => {
        authInitialized = true;
        unsubscribe();
        resolve();
      });
    }
  });
};

const routes = [
  {
    path: '/',
    name: 'home',
    component: LoggedOutHomeView, // Use the new LoggedOutHomeView
    beforeEnter: (to, from, next) => {
      if (auth.currentUser) {
        next('/generate'); // Redirect to /generate if logged in
      } else {
        next(); // Otherwise, stay on logged-out home
      }
    }
  },
  {
    path: '/generate',
    name: 'generate',
    component: GenerationView,
    meta: { requiresAuth: true }
  },
  {
    path: '/auth',
    name: 'auth',
    component: AuthForm,
  },
  {
    path: '/leaderboard',
    name: 'leaderboard',
    component: LeaderboardComponent,
    meta: { requiresAuth: true }
  },
    {
        path: '/pricing', // Add pricing route
        name: 'pricing',
        component: () => import('@/components/ui/PricingComponent.vue'), // Lazy-load for better performance.
        // No auth required to *view* pricing.
    },
  {
    path: '/:pathMatch(.*)*', // Catch-all route for 404
    name: 'not-found',
    component: NotFound,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

router.beforeEach(async (to, from, next) => {
  // Wait for auth to initialize before any navigation
  await waitForAuthInit();
  const currentUser = auth.currentUser;

  // Handle auth page access
  if (to.path === '/auth') {
    if (currentUser) {
      next('/generate');
      return;
    }
    next();
    return;
  }

  // Handle protected routes
  if (to.matched.some(record => record.meta.requiresAuth)) {
     if (!currentUser && !getDeveloperApiKey()) { // Check for API key
      next('/auth'); // Redirect to auth if no user *and* no API key
      return;
    }
    next();
    return;
  }

  // Handle landing page
  if (to.path === '/' && currentUser) {
    next('/generate');
    return;
  }

  next();
});

export default router;