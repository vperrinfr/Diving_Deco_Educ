import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../views/HomePage.vue';
import CalculatorPage from '../views/CalculatorPage.vue';
import UserGuidePage from '../views/UserGuidePage.vue';
import DiveSitePage from '../views/DiveSitePage.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/calculator',
      name: 'calculator',
      component: CalculatorPage,
    },
    {
      path: '/dive-site',
      name: 'diveSite',
      component: DiveSitePage,
    },
    {
      path: '/guide',
      name: 'guide',
      component: UserGuidePage,
    },
  ],
});

export default router;

// Made with Bob
