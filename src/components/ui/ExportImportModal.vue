<template>
  <Teleport to="body">
    <Transition name="export-import">
      <div v-if="open" class="ei-overlay" @click.self="emit('close')">
        <div
          class="ei-dialog"
          role="dialog"
          aria-modal="true"
          aria-label="Export / Import board"
          @keydown.esc.stop.prevent="emit('close')"
        >
          <header class="ei-header">
            <h2 class="ei-title">Export / Import</h2>
            <button type="button" class="ei-close" aria-label="Close" @click="emit('close')">
              <ion-icon :icon="closeOutline" aria-hidden="true" />
            </button>
          </header>

          <section class="ei-section" aria-label="Export board">
            <h3 class="ei-section-title">Export board</h3>
            <p class="ei-section-text">Download the current board (columns, cards, and members) as a JSON file.</p>
            <button type="button" class="ei-btn ei-primary" @click="exportBoard">
              <ion-icon :icon="downloadOutline" aria-hidden="true" />
              <span>Export JSON</span>
            </button>
          </section>

          <div class="ei-divider" role="separator"></div>

          <section class="ei-section" aria-label="Import board">
            <h3 class="ei-section-title">Import board</h3>
            <p class="ei-section-text">
              Replace this board with data from a previously exported JSON file. This will overwrite your current board.
            </p>

            <input
              ref="fileInput"
              class="ei-file-input"
              type="file"
              accept=".json,application/json"
              aria-label="Choose board JSON file"
              @change="onFileChange"
            />

            <div class="ei-import-actions">
              <button type="button" class="ei-btn ei-secondary" @click="pickFile">
                <ion-icon :icon="cloudUploadOutline" aria-hidden="true" />
                <span>{{ selectedFileName ? 'Choose another file' : 'Choose file' }}</span>
              </button>
              <span v-if="selectedFileName" class="ei-file-name" :title="selectedFileName">{{ selectedFileName }}</span>
            </div>

            <p v-if="importError" class="ei-error" role="alert">{{ importError }}</p>

            <button type="button" class="ei-btn ei-danger" :disabled="!selectedFile || importing" @click="importBoard">
              <ion-icon :icon="alertOutline" aria-hidden="true" />
              <span>{{ importing ? 'Importing…' : 'Import and replace board' }}</span>
            </button>
          </section>

          <div class="ei-footer">
            <button type="button" class="ei-btn ei-ghost" @click="emit('close')">Close</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import { IonIcon } from '@ionic/vue';
import { alertOutline, closeOutline, cloudUploadOutline, downloadOutline } from 'ionicons/icons';
import { showToast } from '@/composables/useToast';
import { getBoardSnapshot, importBoardState } from '@/stores/storage';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const selectedFileName = ref('');
const importError = ref('');
const importing = ref(false);

function resetImportState() {
  selectedFile.value = null;
  selectedFileName.value = '';
  importError.value = '';
  importing.value = false;
  if (fileInput.value) fileInput.value.value = '';
}

function exportBoard() {
  try {
    const snapshot = getBoardSnapshot();
    const json = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const stamp = new Date().toISOString().slice(0, 10);
    const name =
      (snapshot.name || 'board')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'board';
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name}-${stamp}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('Board exported', 'success');
  } catch {
    showToast('Could not export board', 'error');
  }
}

function pickFile() {
  fileInput.value?.click();
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement | null;
  const file = input?.files?.[0] ?? null;
  selectedFile.value = file;
  selectedFileName.value = file?.name ?? '';
  importError.value = '';
}

async function importBoard() {
  const file = selectedFile.value;
  if (!file || importing.value) return;

  importing.value = true;
  importError.value = '';

  try {
    const text = await file.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      importError.value = 'The selected file is not valid JSON.';
      return;
    }

    const ok = await importBoardState(parsed);
    if (!ok) {
      importError.value = 'This file does not look like a valid board export.';
      return;
    }

    showToast('Board imported', 'success');
    emit('close');
  } catch {
    importError.value = 'Could not read or import the selected file.';
  } finally {
    importing.value = false;
  }
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
      resetImportState();
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
.ei-overlay {
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

.ei-dialog {
  width: 100%;
  max-width: 520px;
  padding: 20px 22px 18px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.3);
  color: #111827;
  max-height: calc(100vh - 48px);
  overflow: auto;
}

.ei-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.ei-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.ei-close {
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

.ei-close:hover {
  background: #eef1f7;
  color: #374151;
}

.ei-close ion-icon {
  font-size: 20px;
}

.ei-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ei-section-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.ei-section-text {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.5;
  color: #6b7280;
}

.ei-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 16px 0;
}

.ei-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font: inherit;
}

.ei-btn ion-icon {
  font-size: 16px;
}

.ei-primary {
  align-self: flex-start;
  background: #2f6fed;
  color: #ffffff;
}

.ei-primary:hover {
  background: #2559c9;
}

.ei-secondary {
  background: #eef1f7;
  color: #374151;
}

.ei-secondary:hover {
  background: #e5eaf3;
}

.ei-danger {
  align-self: flex-start;
  background: #dc2626;
  color: #ffffff;
}

.ei-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.ei-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ei-ghost {
  background: #eef1f6;
  color: #374151;
}

.ei-ghost:hover {
  background: #e5eaf3;
}

.ei-file-input {
  display: none;
}

.ei-import-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.ei-file-name {
  font-size: 13px;
  color: #374151;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ei-error {
  margin: 0;
  font-size: 13px;
  color: #dc2626;
}

.ei-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

.ei-btn:focus-visible,
.ei-close:focus-visible {
  outline: 2px solid #2f6fed;
  outline-offset: 2px;
}

.export-import-enter-active,
.export-import-leave-active {
  transition: opacity 0.18s ease;
}

.export-import-enter-active .ei-dialog,
.export-import-leave-active .ei-dialog {
  transition: transform 0.18s ease;
}

.export-import-enter-from,
.export-import-leave-to {
  opacity: 0;
}

.export-import-enter-from .ei-dialog,
.export-import-leave-to .ei-dialog {
  transform: scale(0.96) translateY(6px);
}
</style>
