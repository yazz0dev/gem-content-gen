<!-- src/views/LoggedOutHomeView.vue -->
<template>
  <div class="logged-out-home">
    <section class="landing-hero">
      <div class="hero-content">
        <h1 class="hero-title">Create Professional Content in Minutes</h1>
        <p class="hero-description">
          Generate high-quality resumes, cover letters, and more using advanced AI models.
          Start creating professional content today.
        </p>
        <div class="cta-group">
          <button
            @click="handleGetStarted"
            class="btn cta-button cta-primary"
          >Get Started</button>
          <a href="#features" class="btn cta-button cta-secondary">Learn More</a>
        </div>
      </div>
    </section>

    <section id="features" class="feature-section">
      <div class="container">
        <div class="feature-grid">
          <div class="feature-card">
            <i class="bi bi-file-earmark-text display-4 mb-3"></i>
            <h3>Professional Templates</h3>
            <p>Choose from a variety of professionally designed templates.</p>
          </div>
          <div class="feature-card">
            <i class="bi bi-magic display-4 mb-3"></i>
            <h3>AI-Powered</h3>
            <p>Leverage advanced AI models to generate perfect content.</p>
          </div>
          <div class="feature-card">
            <i class="bi bi-lightning-charge display-4 mb-3"></i>
            <h3>Quick & Easy</h3>
            <p>Create professional content in minutes, not hours.</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { useRouter } from 'vue-router';
import { onMounted } from 'vue';
import { initializeAuthStatusMonitoring } from '@/utils/auth';
import { auth } from '@/api/firebase.js';

export default {
  name: 'LoggedOutHomeView',
  setup() {
    const router = useRouter();

    const handleGetStarted = () => {
      if (auth.currentUser) {
        router.push('/generate');
      } else {
        router.push('/auth');
      }
    };

    onMounted(() => {
      initializeAuthStatusMonitoring();
    });

    return {
      handleGetStarted
    };
  }
};
</script>

<style>
@import '@/assets/css/landing.css';
</style>