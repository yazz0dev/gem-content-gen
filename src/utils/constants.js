// src/utils/constants.js
export const MODEL_LIMITS = {
  'gemini-2.0-pro-exp-02-05': {
    rpm: 60,  // Requests per minute
    tpm: 120000,  // Tokens per minute
    rpd: 1000,  // Requests per day
  },
  'gemini-2.0-flash-thinking-exp-01-21': {
    rpm: 30,
    tpm: 60000,
    rpd: 500,
  },
  'gemini-2.0-flash': {
    rpm: 45,
    tpm: 90000,
    rpd: 750,
  },
  'gemini-2.0-flash-lite-preview-02-05': {
    rpm: 15,
    tpm: 30000,
    rpd: 250,
  }
};

export const DEFAULT_MODEL = 'gemini-2.0-pro-exp-02-05';

export const USER_ROLES = {
  ADMIN: 'admin',
  PAID_USER: 'paid user',
  FREE_USER: 'user',
  GUEST: 'guest'
};

export const PRICING_TIERS = {
  FREE: {
    name: 'Free',
    price: 0,
    features: [
      'Daily generation limit',
      'Basic templates',
      'Standard model access'
    ]
  },
  PRO: {
    name: 'Pro',
    price: 9.99,
    features: [
      'Unlimited generations',
      'Premium templates',
      'Priority model access',
      'Advanced customization'
    ]
  }
};

export const CONTENT_TYPES = {
  RESUME: 'resume',
  POSTER: 'poster',
  SOCIAL_POST: 'social-post',
  SOCIAL_AD: 'social-ad-copy',
  EMAIL: 'email-marketing',
  PRODUCT: 'product-descriptions',
  PROPOSAL: 'business-proposals',
  WEBSITE: 'website-copy',
  PRESS: 'press-releases'
};