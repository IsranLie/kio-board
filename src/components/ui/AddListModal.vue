<template>
  <Teleport to="body">
    <Transition name="add-list">
      <div v-if="open" class="add-list-overlay" @click.self="emit('close')">
        <div
          class="add-list-dialog"
          role="dialog"
          aria-modal="true"
          aria-label="Add new list"
          @keydown.esc.stop.prevent="emit('close')"
        >
          <header class="add-list-header">
            <h2 class="add-list-title">Add new list</h2>
            <button type="button" class="add-list-close" aria-label="Close" @click="emit('close')">
              <ion-icon :icon="closeOutline" aria-hidden="true" />
            </button>
          </header>

          <form class="add-list-form" @submit.prevent="submit">
            <label class="add-list-field">
              <span class="add-list-label">List name</span>
              <input
                ref="nameInput"
                v-model="name"
                class="add-list-input"
                type="text"
                placeholder="e.g. Backlog"
                autocomplete="off"
              />
            </label>

            <div class="add-list-actions">
              <button type="button" class="add-list-btn add-list-cancel" @click="emit('close')">Cancel</button>
              <button type="submit" class="add-list-btn add-list-primary" :disabled="!canSubmit">Add list</button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { IonIcon } from '@ionic/vue';
import { closeOutline } from 'ionicons/icons';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'create', title: string): void;
}>();

const name = ref('');
const nameInput = ref<HTMLInputElement | null>(null);

const canSubmit = computed(() => name.value.trim().length > 0);

function submit() {
  const title = name.value.trim();
  if (!title) return;
  emit('create', title);
  emit('close');
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.open) {
    event.preventDefault();
    emit('close');
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      name.value = '';
      window.addEventListener('keydown', onKeydown);
      nextTick(() => nameInput.value?.focus());
    } else {
      window.removeEventListener('keydown', onKeydown);
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
</script>

<style scoped>
.add-list-overlay {
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

.add-list-dialog {
  width: 100%;
  max-width: 420px;
  padding: 20px 22px 18px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.3);
  color: #111827;
}

.add-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.add-list-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.add-list-close {
  border: none;
  background: transparent;
  color: #6b7280;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
}

.add-list-close:hover {
  background: #eef1f7;
  color: #374151;
}

.add-list-close ion-icon {
  font-size: 20px;
}

.add-list-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.add-list-field {
  display: block;
}

.add-list-label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.add-list-input {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  color: #111827;
  background: #ffffff;
  box-sizing: border-box;
}

.add-list-input::placeholder {
  color: #9ca3af;
}

.add-list-input:focus {
  outline: 2px solid #2f6fed;
  outline-offset: 1px;
  border-color: #2f6fed;
}

.add-list-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.add-list-btn {
  min-width: 96px;
  border: none;
  border-radius: 8px;
  padding: 9px 18px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.add-list-cancel {
  background: #eef1f6;
  color: #374151;
}

.add-list-cancel:hover {
  background: #e5eaf3;
}

.add-list-primary {
  background: #2f6fed;
  color: #ffffff;
}

.add-list-primary:hover:not(:disabled) {
  background: #2559c9;
}

.add-list-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.add-list-btn:focus-visible,
.add-list-close:focus-visible {
  outline: 2px solid #2f6fed;
  outline-offset: 2px;
}

.add-list-enter-active,
.add-list-leave-active {
  transition: opacity 0.18s ease;
}

.add-list-enter-active .add-list-dialog,
.add-list-leave-active .add-list-dialog {
  transition: transform 0.18s ease;
}

.add-list-enter-from,
.add-list-leave-to {
  opacity: 0;
}

.add-list-enter-from .add-list-dialog,
.add-list-leave-to .add-list-dialog {
  transform: scale(0.96) translateY(6px);
}
</style>
