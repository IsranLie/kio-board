<template>
  <Teleport to="body">
    <Transition name="visibility-modal">
      <div v-if="open" class="visibility-overlay" @click.self="emit('close')">
        <div
          class="visibility-dialog"
          role="dialog"
          aria-modal="true"
          aria-label="Change visibility"
          @keydown.esc.stop.prevent="emit('close')"
        >
          <header class="visibility-header">
            <h2 class="visibility-title">Change visibility</h2>
            <button type="button" class="visibility-close" aria-label="Close" @click="emit('close')">
              <ion-icon :icon="closeOutline" aria-hidden="true" />
            </button>
          </header>

          <p class="visibility-message">Choose who can see and access this board.</p>

          <div class="visibility-options" role="radiogroup" aria-label="Board visibility">
            <button
              v-for="option in options"
              :key="option.value"
              type="button"
              class="visibility-option"
              :class="{ 'is-selected': selected === option.value }"
              role="radio"
              :aria-checked="selected === option.value"
              @click="selected = option.value"
            >
              <span class="option-icon" aria-hidden="true">
                <ion-icon :icon="option.icon" />
              </span>
              <span class="option-body">
                <span class="option-title">{{ option.title }}</span>
                <span class="option-description">{{ option.description }}</span>
              </span>
              <ion-icon
                v-if="selected === option.value"
                :icon="checkmarkOutline"
                class="option-check"
                aria-hidden="true"
              />
            </button>
          </div>

          <div class="visibility-actions">
            <button type="button" class="visibility-btn visibility-cancel" @click="emit('close')">Cancel</button>
            <button type="button" class="visibility-btn visibility-save" @click="save">Done</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import { IonIcon } from '@ionic/vue';
import { checkmarkOutline, closeOutline, globeOutline, lockClosedOutline, peopleOutline } from 'ionicons/icons';

type BoardVisibility = 'private' | 'workspace' | 'public';

const props = withDefaults(
  defineProps<{
    open: boolean;
    visibility?: BoardVisibility;
  }>(),
  {
    visibility: 'private',
  },
);

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'change', value: BoardVisibility): void;
}>();

const options: { value: BoardVisibility; title: string; description: string; icon: string }[] = [
  {
    value: 'private',
    title: 'Private',
    description: 'Only board members can see and edit this board.',
    icon: lockClosedOutline,
  },
  {
    value: 'workspace',
    title: 'Workspace',
    description: 'All members of your workspace can see this board.',
    icon: peopleOutline,
  },
  {
    value: 'public',
    title: 'Public',
    description: 'Anyone with the link can view this board.',
    icon: globeOutline,
  },
];

const selected = ref<BoardVisibility>(props.visibility);

function save() {
  emit('change', selected.value);
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
      selected.value = props.visibility;
      window.addEventListener('keydown', onKeydown);
    } else {
      window.removeEventListener('keydown', onKeydown);
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
</script>

<style scoped>
.visibility-overlay {
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

.visibility-dialog {
  width: 100%;
  max-width: 440px;
  padding: 20px 22px 18px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.3);
  color: #111827;
}

.visibility-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.visibility-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.visibility-close {
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

.visibility-close:hover {
  background: #eef1f7;
  color: #374151;
}

.visibility-close ion-icon {
  font-size: 20px;
}

.visibility-message {
  margin: 0 0 16px;
  font-size: 13.5px;
  line-height: 1.5;
  color: #6b7280;
}

.visibility-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.visibility-option {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
  cursor: pointer;
  text-align: left;
  font: inherit;
  color: inherit;
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    box-shadow 0.15s ease;
}

.visibility-option:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.visibility-option.is-selected {
  border-color: #2f6fed;
  background: #f4f8ff;
  box-shadow: 0 0 0 2px rgba(47, 111, 237, 0.12);
}

.option-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #eef1f7;
  color: #374151;
}

.visibility-option.is-selected .option-icon {
  background: #e6edf8;
  color: #1168da;
}

.option-icon ion-icon {
  font-size: 18px;
}

.option-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.option-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.option-description {
  font-size: 13px;
  line-height: 1.4;
  color: #6b7280;
}

.option-check {
  flex-shrink: 0;
  font-size: 18px;
  color: #2f6fed;
  margin-top: 2px;
}

.visibility-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

.visibility-btn {
  min-width: 96px;
  border: none;
  border-radius: 8px;
  padding: 9px 18px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.visibility-cancel {
  background: #eef1f6;
  color: #374151;
}

.visibility-cancel:hover {
  background: #e5eaf3;
}

.visibility-save {
  background: #2f6fed;
  color: #ffffff;
}

.visibility-save:hover {
  background: #2559c9;
}

.visibility-btn:focus-visible,
.visibility-close:focus-visible,
.visibility-option:focus-visible {
  outline: 2px solid #2f6fed;
  outline-offset: 2px;
}

.visibility-modal-enter-active,
.visibility-modal-leave-active {
  transition: opacity 0.18s ease;
}

.visibility-modal-enter-active .visibility-dialog,
.visibility-modal-leave-active .visibility-dialog {
  transition: transform 0.18s ease;
}

.visibility-modal-enter-from,
.visibility-modal-leave-to {
  opacity: 0;
}

.visibility-modal-enter-from .visibility-dialog,
.visibility-modal-leave-to .visibility-dialog {
  transform: scale(0.96) translateY(6px);
}
</style>
