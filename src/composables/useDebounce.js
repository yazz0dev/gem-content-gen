// src/composables/useDebounce.js
import { ref, watch, onUnmounted } from 'vue';

export function useDebounce(value, delay = 500) {
  const debouncedValue = ref(value.value);
  let timeout = null;

  const clear = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

 watch(value, (newValue) => {
    clear();
    timeout = setTimeout(() => {
      debouncedValue.value = newValue;
    }, delay);
  });

  onUnmounted(clear); // Clear timeout if component is unmounted

  return debouncedValue;
}