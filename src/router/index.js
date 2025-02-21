import { createRouter, createWebHistory } from 'vue-router'
import AuthForm from '@/components/AuthForm.vue';
import LeaderboardComponent from '@/components/LeaderboardComponent.vue';
import { auth } from '@/firebase';
import LoggedOutHomeView from '../views/LoggedOutHomeView.vue'; // Import new view
import GenerationView from '../views/GenerationView.vue'; // Import renamed view

// Create a simple NotFound component
const NotFound = { template: '<div>Not Found</div>' };

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
    component: GenerationView,  // Use renamed GenerationView
    meta: { requiresAuth: true } // Requires authentication
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
    path: '/:pathMatch(.*)*', // Catch-all route for 404
    name: 'not-found',
    component: NotFound,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const currentUser = auth.currentUser;

  if (requiresAuth && !currentUser) {
    next('/auth');
  } else {
    next();
  }
});

export default router;