<template>
  <div class="pricing-page">
    <div class="container">
      <h1 class="text-center mb-5">Choose the Right Plan for You</h1>
      <div class="row justify-content-center">
        <!-- Free Tier -->
        <div class="col-md-4 mb-4">
          <div class="card pricing-card">
            <div class="card-body">
              <h5 class="card-title">Free</h5>
              <h6 class="card-subtitle mb-2 text-muted">Trial & Lead Generation</h6>
              <p class="card-text price">$0</p>
               <p class="card-text credits">3-5 Credits</p>
              <ul class="list-unstyled">
                <li><i class="bi bi-check-circle-fill text-success me-2"></i>Gemini 2.0 Flash-Lite Only</li>
                <li><i class="bi bi-check-circle-fill text-success me-2"></i>All Basic Content Types</li>
                <li><i class="bi bi-check-circle-fill text-success me-2"></i>Limited Templates</li>
                 <li><i class="bi bi-x-circle-fill text-danger me-2"></i>No Custom Prompts</li>
                <li><i class="bi bi-x-circle-fill text-danger me-2"></i>1 Generation per day</li>
              </ul>
               <button @click="handleSelectPlan('free')" class="btn btn-outline-primary w-100" :disabled="isLoggedIn">
                {{ isLoggedIn ? 'Current Plan' : 'Get Started' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Starter Pack -->
        <div class="col-md-4 mb-4">
           <div class="card pricing-card">
            <div class="card-body">
              <h5 class="card-title">Starter</h5>
              <h6 class="card-subtitle mb-2 text-muted">Entry-Level</h6>
              <p class="card-text price">~$5</p>
              <p class="card-text credits">Credits: TBD</p>
              <ul class="list-unstyled">
                <li><i class="bi bi-check-circle-fill text-success me-2"></i>Gemini 2.0 Flash-Lite & Flash</li>
                <li><i class="bi bi-check-circle-fill text-success me-2"></i>All Basic Content Types</li>
                <li><i class="bi bi-check-circle-fill text-success me-2"></i>Most Templates</li>
                <li><i class="bi bi-x-circle-fill text-danger me-2"></i>No Custom Prompts</li>
              </ul>
               <button @click="handleSelectPlan('starter')" class="btn btn-primary w-100">
                Select Starter
              </button>
            </div>
          </div>
        </div>

        <!-- Standard Pack -->
        <div class="col-md-4 mb-4">
           <div class="card pricing-card">
            <div class="card-body">
              <h5 class="card-title">Standard</h5>
              <h6 class="card-subtitle mb-2 text-muted">Best Value</h6>
              <p class="card-text price">~$15-20</p>
             <p class="card-text credits">Credits: TBD</p>
              <ul class="list-unstyled">
                 <li><i class="bi bi-check-circle-fill text-success me-2"></i>Gemini 2.0 Flash-Lite, Flash, Pro-Exp</li>
                <li><i class="bi bi-check-circle-fill text-success me-2"></i>All Content Types</li>
                <li><i class="bi bi-check-circle-fill text-success me-2"></i>All Templates</li>
                <li><i class="bi bi-check-circle-fill text-success me-2"></i>Some Advanced Features</li>
                  <li><i class="bi bi-x-circle-fill text-danger me-2"></i>Limited Custom Prompts</li>
              </ul>
               <button @click="handleSelectPlan('standard')" class="btn btn-primary w-100">
                Select Standard
              </button>
            </div>
          </div>
        </div>

        <!-- Premium Pack -->
        <div class="col-md-4 mb-4">
          <div class="card pricing-card">
            <div class="card-body">
              <h5 class="card-title">Premium</h5>
              <h6 class="card-subtitle mb-2 text-muted">Full-Featured</h6>
              <p class="card-text price">~$40-50</p>
               <p class="card-text credits">Credits: TBD</p>
               <ul class="list-unstyled">
                <li><i class="bi bi-check-circle-fill text-success me-2"></i>All Models</li>
                <li><i class="bi bi-check-circle-fill text-success me-2"></i>All Features Unlocked</li>
                <li><i class="bi bi-check-circle-fill text-success me-2"></i>Full Custom Prompt Capabilities</li>
              </ul>
              <button @click="handleSelectPlan('premium')" class="btn btn-primary w-100">
                Select Premium
              </button>
            </div>
          </div>
        </div>
      </div>
        <!-- Placeholder for Stripe Elements -->
      <div id="payment-element"></div>
      <p v-if="paymentError" class="text-danger">{{ paymentError }}</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { auth } from '@/firebase';
import { useRouter } from 'vue-router';

export default {
  name: 'PricingComponent',
  setup() {
    const isLoggedIn = ref(false);
    const paymentError = ref('');
    const router = useRouter();

    const authListener = auth.onAuthStateChanged(user => {
      isLoggedIn.value = !!user;
    });

    onMounted(() => {
       // Initialize Stripe (replace with your actual publishable key)
      // This is just a placeholder, you'll need to load the Stripe.js library
      // and handle actual payment processing.
      /*
        const stripe = Stripe('pk_test_YOUR_PUBLISHABLE_KEY');
        const elements = stripe.elements();
        const paymentElement = elements.create('payment');
        paymentElement.mount('#payment-element');
        */
    });

    onUnmounted(() => {
      authListener(); // Unsubscribe from auth listener
    });

    const handleSelectPlan = (plan) => {
        if (!isLoggedIn.value && plan !== 'free') {
            // Redirect to auth page if not logged in and not selecting the free plan
            router.push('/auth');
        } else if(plan === 'free') { //Free Plan
            //If free plan is selected and user is not logged in
            router.push('/auth'); //redirect to auth
        }else {
            // For now, this is just a placeholder.  You'll integrate
            // with Stripe Checkout or Elements here.
            paymentError.value = 'Payment processing not yet implemented.';
        }
    };

    return { isLoggedIn, paymentError, handleSelectPlan };
  }
};
</script>

<style scoped>
.pricing-page {
  padding: 40px 0;
  background-color: var(--background-color);
}

.pricing-card {
  border: none;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  transition: transform 0.2s ease-in-out;
}

.pricing-card:hover {
  transform: translateY(-5px);
}

.price {
  font-size: 2rem;
  font-weight: bold;
  color: var(--primary-color);
}

.credits {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--text-secondary);
}

.btn-primary {
    background: var(--primary-color);
    border: none;
    box-shadow: var(--shadow-md);
    color: white;
    padding: var(--spacing-sm) var(--spacing-lg);
    border-radius: var(--border-radius-md);
    transition: all 0.2s ease;
}
.btn-primary:hover:not(:disabled) {
    background: var(--primary-hover);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

.btn-outline-primary{
       border: 2px solid var(--primary-color);
       color:  var(--primary-color);
}
.btn-outline-primary:hover:not(:disabled) {
    background: var(--primary-hover);
     border: 2px solid var(--primary-hover);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    color:white;
}
</style>