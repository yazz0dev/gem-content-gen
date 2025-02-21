<template>
    <div class="page-container">
      <div class="hero-section mb-5">
        <div class="container">
          <div class="row align-items-center">
            <div class="col-md-6">
              <h1 class="hero-title">Create Professional Content Instantly</h1>
              <p class="hero-description">Generate high-quality resumes, cover letters, social media posts, and more using advanced AI models.</p>
              <button @click="$router.push('/auth')" class="cta-button">
                Get Started
              </button>
  
               <!-- Feature Highlights (Example - Expand) -->
              <div class="features-grid mt-4">
                <div class="feature-item">
                  <i class="bi bi-file-earmark-text me-2"></i> Resumes
                </div>
                <div class="feature-item">
                  <i class="bi bi-envelope-open me-2"></i> Cover Letters
                </div>
                <div class="feature-item">
                  <i class="bi bi-instagram me-2"></i> Social Media
                </div>
                <!-- Add more feature items -->
              </div>
            </div>
            <div class="col-md-6">
              <!-- Add illustration or image here (Placeholder) -->
              <img src="/path/to/your/image.png" alt="Content Generation Illustration" class="img-fluid">
            </div>
          </div>
  
            <!-- More Info Section (Optional, but recommended) -->
          <div class="row mt-5">
             <div class="col-12">
                  <h2>Key Features</h2>
                  <p>Explore the power of AI-driven content creation:</p>
              </div>
  
              <div class="feature-cards">
  
                <div class="feature-card">
                  <h3 class="feature-title">Multiple Content Types</h3>
                  <p class="feature-description">Create various types of content including resumes, cover letters, and social media posts.</p>
                </div>
  
                <div class="feature-card">
                  <h3 class="feature-title">Customizable Templates</h3>
                  <p class="feature-description">Choose from different design templates.</p>
                </div>
  
                <div class="feature-card">
                  <h3 class="feature-title">Powerful AI Models</h3>
                  <p class="feature-description">Leverage top-tier AI models for high-quality results.</p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'LoggedOutHomeView',
  };
  </script>
  
  <style scoped>
  /* You can move relevant styles from HomeView.vue (hero section) to here */
  </style>