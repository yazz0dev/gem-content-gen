// src/utils/constants.js
export const MODEL_LIMITS = {
    "gemini-2.0-flash": {
        rpm: 15,
        tpm: 1000000,
        rpd: 1500,
    },
    "gemini-2.0-flash-lite-preview-02-05": {
        rpm: 30,
        tpm: 1000000,
        rpd: 1500,
    },
    "gemini-2.0-pro-exp-02-05": {
        rpm: 2,
        tpm: 1000000,
        rpd: 50,
    },
    "gemini-2.0-flash-thinking-exp-01-21": {
        rpm: 10,
        tpm: 4000000,
        rpd: 1500,
    },
};

export const DEFAULT_MODEL = "gemini-2.0-flash"; // Set a default model