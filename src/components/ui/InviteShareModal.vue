<template>
  <Teleport to="body">
    <Transition name="invite-share">
      <div v-if="open" class="invite-overlay" @click.self="emit('close')">
        <div
          class="invite-dialog"
          role="dialog"
          aria-modal="true"
          aria-label="Share board"
          @keydown.esc.stop.prevent="emit('close')"
        >
          <header class="invite-header">
            <h2 class="invite-title">Share board</h2>
            <button type="button" class="invite-close" aria-label="Close" @click="emit('close')">
              <ion-icon :icon="closeOutline" aria-hidden="true" />
            </button>
          </header>

          <p class="invite-message">Invite others to collaborate by sharing this link.</p>

          <label class="invite-link-row">
            <span class="invite-link-label">Board link</span>
            <div class="invite-link-field">
              <input
                ref="linkInput"
                class="invite-link-input"
                type="text"
                :value="shareUrl"
                readonly
                aria-label="Board link"
                @focus="selectLink"
              />
              <button type="button" class="invite-copy-btn" @click="copyLink">
                <ion-icon :icon="copied ? checkmarkOutline : copyOutline" aria-hidden="true" />
                <span>{{ copied ? 'Copied!' : 'Copy link' }}</span>
              </button>
            </div>
          </label>

          <div class="invite-actions">
            <button type="button" class="invite-done-btn" @click="emit('close')">Done</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { IonIcon } from '@ionic/vue';
import { checkmarkOutline, closeOutline, copyOutline } from 'ionicons/icons';

const props = withDefaults(
  defineProps<{
    open: boolean;
    url?: string;
  }>(),
  {
    url: '',
  },
);

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const copied = ref(false);
const linkInput = ref<HTMLInputElement | null>(null);
let copiedTimer: ReturnType<typeof setTimeout> | null = null;

const shareUrl = computed(() => {
  if (props.url) return props.url;
  if (typeof window !== 'undefined') return window.location.href;
  return '';
});

function selectLink() {
  linkInput.value?.select();
}

async function copyLink() {
  const value = shareUrl.value;
  if (!value) return;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
    } else {
      linkInput.value?.select();
      document.execCommand('copy');
    }
  } catch {
    linkInput.value?.select();
  }

  copied.value = true;
  if (copiedTimer) clearTimeout(copiedTimer);
  copiedTimer = setTimeout(() => {
    copied.value = false;
    copiedTimer = null;
  }, 2000);
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
      copied.value = false;
      window.addEventListener('keydown', onKeydown);
      nextTick(() => linkInput.value?.focus());
    } else {
      window.removeEventListener('keydown', onKeydown);
      if (copiedTimer) {
        clearTimeout(copiedTimer);
        copiedTimer = null;
      }
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  if (copiedTimer) clearTimeout(copiedTimer);
});
</script>

<style scoped>
.invite-overlay {
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

.invite-dialog {
  width: 100%;
  max-width: 440px;
  padding: 20px 22px 18px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.3);
  color: #111827;
}

.invite-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.invite-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.invite-close {
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

.invite-close:hover {
  background: #eef1f7;
  color: #374151;
}

.invite-close ion-icon {
  font-size: 20px;
}

.invite-message {
  margin: 0 0 16px;
  font-size: 13.5px;
  line-height: 1.5;
  color: #6b7280;
}

.invite-link-row {
  display: block;
}

.invite-link-label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.invite-link-field {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.invite-link-input {
  flex: 1;
  min-width: 0;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
  color: #111827;
  background: #f9fafb;
}

.invite-link-input:focus {
  outline: 2px solid #2f6fed;
  outline-offset: 1px;
  border-color: #2f6fed;
}

.invite-copy-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  background: #2f6fed;
  color: #ffffff;
  white-space: nowrap;
}

.invite-copy-btn:hover {
  background: #2559c9;
}

.invite-copy-btn ion-icon {
  font-size: 16px;
}

.invite-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

.invite-done-btn {
  min-width: 96px;
  border: none;
  border-radius: 8px;
  padding: 9px 18px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: #eef1f6;
  color: #374151;
}

.invite-done-btn:hover {
  background: #e5eaf3;
}

.invite-done-btn:focus-visible,
.invite-copy-btn:focus-visible,
.invite-close:focus-visible {
  outline: 2px solid #2f6fed;
  outline-offset: 2px;
}

.invite-share-enter-active,
.invite-share-leave-active {
  transition: opacity 0.18s ease;
}

.invite-share-enter-active .invite-dialog,
.invite-share-leave-active .invite-dialog {
  transition: transform 0.18s ease;
}

.invite-share-enter-from,
.invite-share-leave-to {
  opacity: 0;
}

.invite-share-enter-from .invite-dialog,
.invite-share-leave-to .invite-dialog {
  transform: scale(0.96) translateY(6px);
}

@media (max-width: 520px) {
  .invite-link-field {
    flex-direction: column;
  }

  .invite-copy-btn {
    justify-content: center;
  }
}
</style>
