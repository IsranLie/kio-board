<template>
  <Teleport to="body">
    <Transition name="confirm">
      <div v-if="open" class="confirm-overlay" @click.self="emit('cancel')">
        <div
          ref="dialogRef"
          class="confirm-dialog"
          role="alertdialog"
          aria-modal="true"
          :aria-label="title"
          @keydown.esc.stop.prevent="emit('cancel')"
        >
          <div class="confirm-icon" :class="{ 'is-danger': danger }">
            <ion-icon :icon="danger ? alertOutline : helpCircleOutline" aria-hidden="true" />
          </div>

          <h2 class="confirm-title">{{ title }}</h2>
          <p v-if="message" class="confirm-message">{{ message }}</p>

          <div class="confirm-actions">
            <button type="button" class="confirm-btn confirm-cancel" @click="emit('cancel')">
              {{ cancelText }}
            </button>
            <button
              ref="confirmBtn"
              type="button"
              class="confirm-btn"
              :class="danger ? 'confirm-danger' : 'confirm-primary'"
              @click="emit('confirm')"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { IonIcon } from '@ionic/vue';
import { alertOutline, helpCircleOutline } from 'ionicons/icons';

const props = withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    /** Red confirm button + warning icon. */
    danger?: boolean;
  }>(),
  {
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    danger: false,
  },
);

const emit = defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

const confirmBtn = ref<HTMLButtonElement | null>(null);
const dialogRef = ref<HTMLElement | null>(null);

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.open) {
    event.preventDefault();
    emit('cancel');
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      window.addEventListener('keydown', onKeydown);
      nextTick(() => confirmBtn.value?.focus());
    } else {
      window.removeEventListener('keydown', onKeydown);
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(17, 24, 39, 0.5);
  backdrop-filter: blur(2px);
}

.confirm-dialog {
  width: 100%;
  max-width: 380px;
  padding: 24px 22px 18px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.3);
  text-align: center;
  color: #111827;
}

.confirm-icon {
  width: 52px;
  height: 52px;
  margin: 0 auto 14px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eef1f6;
  color: #4b5563;
}

.confirm-icon.is-danger {
  background: #fee2e2;
  color: #dc2626;
}

.confirm-icon ion-icon {
  font-size: 26px;
}

.confirm-title {
  margin: 0 0 6px;
  font-size: 17px;
  font-weight: 700;
}

.confirm-message {
  margin: 0 0 20px;
  font-size: 13.5px;
  line-height: 1.5;
  color: #6b7280;
  overflow-wrap: anywhere;
}

.confirm-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.confirm-btn {
  min-width: 96px;
  border: none;
  border-radius: 8px;
  padding: 9px 18px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.confirm-cancel {
  background: #eef1f6;
  color: #374151;
}

.confirm-cancel:hover {
  background: #e5eaf3;
}

.confirm-danger {
  background: #dc2626;
  color: #ffffff;
}

.confirm-danger:hover {
  background: #b91c1c;
}

.confirm-primary {
  background: #2f6fed;
  color: #ffffff;
}

.confirm-primary:hover {
  background: #2559c9;
}

.confirm-btn:focus-visible {
  outline: 2px solid #2f6fed;
  outline-offset: 2px;
}

.confirm-enter-active,
.confirm-leave-active {
  transition: opacity 0.18s ease;
}

.confirm-enter-active .confirm-dialog,
.confirm-leave-active .confirm-dialog {
  transition: transform 0.18s ease;
}

.confirm-enter-from,
.confirm-leave-to {
  opacity: 0;
}

.confirm-enter-from .confirm-dialog,
.confirm-leave-to .confirm-dialog {
  transform: scale(0.96) translateY(6px);
}
</style>
