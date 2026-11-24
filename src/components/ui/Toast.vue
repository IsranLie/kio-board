<template>
  <Teleport to="body">
    <div class="toast-stack" role="status" aria-live="polite">
      <TransitionGroup name="toast">
        <div v-for="toast in toasts" :key="toast.id" class="toast" :class="`toast-${toast.variant}`">
          <ion-icon :icon="iconFor(toast.variant)" class="toast-icon" aria-hidden="true" />
          <span class="toast-message">{{ toast.message }}</span>
          <button type="button" class="toast-close" aria-label="Dismiss" @click="dismissToast(toast.id)">
            <ion-icon :icon="closeOutline" aria-hidden="true" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import { alertCircleOutline, checkmarkCircleOutline, closeOutline, informationCircleOutline } from 'ionicons/icons';
import { useToast, type ToastVariant } from '@/composables/useToast';

const { toasts, dismissToast } = useToast();

function iconFor(variant: ToastVariant) {
  if (variant === 'error') return alertCircleOutline;
  if (variant === 'info') return informationCircleOutline;
  return checkmarkCircleOutline;
}
</script>

<style scoped>
.toast-stack {
  position: fixed;
  left: 50%;
  bottom: 24px;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  transform: translateX(-50%);
  pointer-events: none;
}

.toast {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  max-width: min(92vw, 420px);
  padding: 11px 12px 11px 14px;
  border-radius: 10px;
  background: #1f2937;
  color: #f9fafb;
  font-size: 13.5px;
  font-weight: 500;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.28);
  pointer-events: auto;
}

.toast-icon {
  font-size: 19px;
  flex-shrink: 0;
}

.toast-success .toast-icon {
  color: #34d399;
}

.toast-error .toast-icon {
  color: #f87171;
}

.toast-info .toast-icon {
  color: #60a5fa;
}

.toast-message {
  line-height: 1.4;
}

.toast-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  flex-shrink: 0;
}

.toast-close:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #f9fafb;
}

.toast-close ion-icon {
  font-size: 15px;
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.toast-move {
  transition: transform 0.2s ease;
}

@media (max-width: 640px) {
  .toast-stack {
    bottom: 16px;
  }
}
</style>
