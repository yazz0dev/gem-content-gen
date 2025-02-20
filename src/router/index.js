import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LeaderboardComponent from '@/components/LeaderboardComponent.vue';
import AuthForm from '@/components/AuthForm.vue';
import { auth } from '@/firebase';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
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