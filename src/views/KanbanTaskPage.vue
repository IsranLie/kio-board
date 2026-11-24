<template>
  <div class="task-overlay" @click.self="discard">
    <div class="task-modal" role="dialog" aria-modal="true" aria-label="Task details">
      <header class="sheet-head">
        <button
          type="button"
          class="complete-toggle"
          :class="{ 'is-active': draft.completed }"
          :aria-pressed="draft.completed"
          @click="draft.completed = !draft.completed"
        >
          <ion-icon :icon="checkmarkOutline" aria-hidden="true" />
          <span>Mark Complete</span>
        </button>
        <div class="head-actions">
          <button
            v-if="taskId !== 'new'"
            type="button"
            class="delete-btn"
            aria-label="Delete task"
            title="Delete task"
            @click="removeTask"
          >
            <ion-icon :icon="trashOutline" aria-hidden="true" />
          </button>
          <button type="button" class="close-btn" aria-label="Close" @click="discard">
            <ion-icon :icon="closeOutline" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div class="task-scroll">
        <button v-if="!draft.image" type="button" class="cover-add" @click="pickCover">
          <ion-icon :icon="imageOutline" aria-hidden="true" />
          <span>Add Cover Image</span>
        </button>
        <div v-else class="cover-preview">
          <img :src="draft.image" alt="Task cover" />
          <button type="button" class="cover-remove" aria-label="Remove cover" @click="draft.image = ''">
            <ion-icon :icon="closeOutline" aria-hidden="true" />
          </button>
        </div>
        <input ref="coverInput" type="file" accept="image/*" class="hidden-input" @change="onCoverChange" />

        <div class="title-row">
          <input
            v-if="editingTitle"
            ref="titleInput"
            v-model="draft.title"
            class="title-input"
            placeholder="Task title"
            @blur="editingTitle = false"
            @keyup.enter="editingTitle = false"
          />
          <h1 v-else class="title-text" @click="startTitleEdit">{{ draft.title || 'Untitled task' }}</h1>
          <button type="button" class="pencil-btn" aria-label="Edit title" @click="startTitleEdit">
            <ion-icon :icon="pencilOutline" aria-hidden="true" />
          </button>
        </div>

        <div class="fields">
          <div class="field-col">
            <div class="field">
              <span class="field-label">Assignee</span>
              <div ref="assigneeWrap" class="control assignee-control">
                <KanbanMembers
                  v-if="draft.members.length"
                  :members="draft.members"
                  removable
                  @remove="removeAssignee"
                />
                <span v-else class="placeholder">Unassigned</span>
                <button
                  type="button"
                  class="assignee-add"
                  aria-label="Add assignee"
                  @click="assigneeOpen = !assigneeOpen"
                >
                  <ion-icon :icon="addOutline" aria-hidden="true" />
                </button>
                <div v-if="assigneeOpen" class="assignee-menu">
                  <button
                    v-for="option in assigneeOptions"
                    :key="option.name"
                    type="button"
                    class="assignee-option"
                    :class="{ selected: isAssigned(option.name) }"
                    @click="toggleAssignee(option)"
                  >
                    <span class="option-avatar" :style="{ backgroundColor: option.color }">
                      {{ option.initials }}
                    </span>
                    <span class="option-name">{{ option.name }}</span>
                    <ion-icon
                      v-if="isAssigned(option.name)"
                      :icon="checkmarkOutline"
                      class="option-check"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </div>
            </div>

            <div class="field">
              <span class="field-label">Board</span>
              <div class="control">
                <select v-model="draft.boardName">
                  <option v-for="option in boardOptions" :key="option" :value="option">{{ option }}</option>
                </select>
                <ion-icon :icon="chevronDownOutline" class="caret" aria-hidden="true" />
              </div>
            </div>

            <div class="field">
              <span class="field-label">Label</span>
              <div class="control">
                <select v-model="draft.tag">
                  <option v-for="option in tagOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
                <ion-icon :icon="chevronDownOutline" class="caret" aria-hidden="true" />
              </div>
            </div>
          </div>

          <div class="field-col">
            <div class="field">
              <span class="field-label">Due Date</span>
              <div class="control date-control" @click="openDatePicker">
                <span class="date-text" :class="{ placeholder: !dueDateLabel }">
                  {{ dueDateLabel || 'Select date' }}
                </span>
                <ion-icon :icon="calendarOutline" aria-hidden="true" />
                <input ref="dateInput" v-model="draft.dateIso" type="date" class="date-native" aria-label="Due date" />
              </div>
            </div>

            <div class="field">
              <span class="field-label">Column</span>
              <div class="control">
                <select v-model="draft.columnId">
                  <option v-for="column in columnOptions" :key="column.id" :value="column.id">
                    {{ column.title }}
                  </option>
                </select>
                <ion-icon :icon="chevronDownOutline" class="caret" aria-hidden="true" />
              </div>
            </div>

            <div class="field">
              <span class="field-label">Priority</span>
              <div class="control">
                <select v-model="draft.priority">
                  <option v-for="option in priorityOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
                <ion-icon :icon="chevronDownOutline" class="caret" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>

        <section class="section">
          <h2 class="section-title">Description</h2>
          <div class="description-wrap">
            <span v-if="!draft.description && !descriptionFocused" class="description-placeholder" aria-hidden="true">
              <ion-icon :icon="pencilOutline" />
              <span>Add a more detailed description...</span>
            </span>
            <textarea
              v-model="draft.description"
              class="description-input"
              aria-label="Description"
              rows="4"
              @focus="descriptionFocused = true"
              @blur="descriptionFocused = false"
            />
          </div>
        </section>

        <section class="section">
          <h2 class="section-title">Attachments</h2>
          <label class="dropzone" @dragover.prevent @drop.prevent="onDrop">
            <ion-icon :icon="cloudUploadOutline" aria-hidden="true" />
            <span class="dropzone-text">
              <strong>Drag &amp; Drop</strong> files here
              <span class="or">or</span>
              <span class="browse">browse from device</span>
            </span>
            <input type="file" multiple class="hidden-input" @change="onAttachChange" />
          </label>

          <ul v-if="draft.attachmentFiles.length" class="attachment-list">
            <li v-for="file in draft.attachmentFiles" :key="file.id" class="attachment-item">
              <span class="file-name">{{ file.name }}</span>
              <span v-if="file.size" class="file-size">{{ file.size }}</span>
              <button
                type="button"
                class="row-remove"
                aria-label="Remove attachment"
                @click="removeAttachment(file.id)"
              >
                <ion-icon :icon="trashOutline" aria-hidden="true" />
              </button>
            </li>
          </ul>
        </section>

        <section class="section">
          <div class="section-head">
            <h2 class="section-title">Check List</h2>
            <span class="checklist-count">{{ doneSubtasks }}/{{ totalSubtasks }}</span>
          </div>
          <div class="progress-track">
            <span class="progress-fill" :style="{ width: `${progressPct}%` }" />
          </div>

          <ul v-if="draft.checklistItems.length" class="subtask-list">
            <li v-for="item in draft.checklistItems" :key="item.id" class="subtask-item">
              <label class="subtask">
                <input v-model="item.done" type="checkbox" />
                <span :class="{ done: item.done }">{{ item.text }}</span>
              </label>
              <button type="button" class="row-remove" aria-label="Remove subtask" @click="removeSubtask(item.id)">
                <ion-icon :icon="trashOutline" aria-hidden="true" />
              </button>
            </li>
          </ul>

          <input
            v-if="addingSubtask"
            ref="subtaskInput"
            v-model="newSubtask"
            class="subtask-input"
            placeholder="Subtask name"
            @keyup.enter="commitSubtask"
            @blur="onSubtaskBlur"
          />
          <button v-else type="button" class="add-subtask" @click="startSubtask">
            <ion-icon :icon="addOutline" aria-hidden="true" />
            <span>Add subtask</span>
          </button>
        </section>

        <section class="section">
          <h2 class="section-title">Activity</h2>
          <p class="empty-state">No activity yet.</p>
        </section>
      </div>

      <footer class="task-footer">
        <div class="footer-inner">
          <button type="button" class="btn btn-discard" @click="discard">Discard</button>
          <button type="button" class="btn btn-save" @click="save">Save</button>
        </div>
      </footer>
    </div>
  </div>

  <ConfirmDialog
    :open="confirmDeleteOpen"
    danger
    title="Delete task?"
    :message="deleteMessage"
    confirm-text="Delete"
    cancel-text="Cancel"
    @confirm="confirmDelete"
    @cancel="confirmDeleteOpen = false"
  />
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { IonIcon } from '@ionic/vue';
import {
  addOutline,
  calendarOutline,
  checkmarkOutline,
  chevronDownOutline,
  closeOutline,
  cloudUploadOutline,
  imageOutline,
  pencilOutline,
  trashOutline,
} from 'ionicons/icons';
import KanbanMembers from '@/components/kanban/KanbanMembers.vue';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';
import { showToast } from '@/composables/useToast';
import { board, createCard, findCard, memberDirectory, removeCard, upsertCard } from '@/stores/storage';
import type {
  KanbanAttachment,
  KanbanCard,
  KanbanChecklistItem,
  KanbanMember,
  Priority,
  TagType,
} from '@/types/kanban';

interface TaskDraft {
  id: string;
  title: string;
  columnId: string;
  boardName: string;
  members: KanbanMember[];
  dateIso: string;
  tag: TagType;
  priority: Priority;
  description: string;
  image: string;
  completed: boolean;
  checklistItems: KanbanChecklistItem[];
  attachmentFiles: KanbanAttachment[];
}

const props = defineProps<{
  taskId: string;
  columnId?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const boardOptions = ['Adhivasindo', 'Personal'];
const tagOptions: { value: TagType; label: string }[] = [
  { value: 'feature', label: 'Feature' },
  { value: 'bug', label: 'Bug' },
  { value: 'issue', label: 'Issue' },
  { value: 'undefined', label: 'Undefined' },
];
const priorityOptions: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const columnOptions = computed(() => board.columns.map((column) => ({ id: column.id, title: column.title })));
const assigneeOptions = computed(() => memberDirectory());

const draft = reactive<TaskDraft>({
  id: '',
  title: '',
  columnId: board.columns[0]?.id ?? 'todo',
  boardName: board.name,
  members: [],
  dateIso: '',
  tag: 'undefined',
  priority: 'medium',
  description: '',
  image: '',
  completed: false,
  checklistItems: [],
  attachmentFiles: [],
});

const originalColumnId = ref<string | undefined>(undefined);
const originalChecklist = ref<string | undefined>(undefined);
const originalAttachments = ref<number | undefined>(undefined);

const editingTitle = ref(false);
const assigneeOpen = ref(false);
const addingSubtask = ref(false);
const newSubtask = ref('');
const descriptionFocused = ref(false);
const confirmDeleteOpen = ref(false);

const titleInput = ref<HTMLInputElement | null>(null);
const coverInput = ref<HTMLInputElement | null>(null);
const subtaskInput = ref<HTMLInputElement | null>(null);
const dateInput = ref<HTMLInputElement | null>(null);
const assigneeWrap = ref<HTMLElement | null>(null);

const legacyChecklist = computed(() => {
  const match = originalChecklist.value?.match(/(\d+)\s*\/\s*(\d+)/);
  return match ? { done: Number(match[1]), total: Number(match[2]) } : null;
});
const totalSubtasks = computed(() =>
  draft.checklistItems.length ? draft.checklistItems.length : (legacyChecklist.value?.total ?? 0),
);
const doneSubtasks = computed(() =>
  draft.checklistItems.length
    ? draft.checklistItems.filter((item) => item.done).length
    : (legacyChecklist.value?.done ?? 0),
);
const progressPct = computed(() =>
  totalSubtasks.value ? Math.round((doneSubtasks.value / totalSubtasks.value) * 100) : 0,
);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const dueDateLabel = computed(() => formatLongDate(draft.dateIso));

const deleteMessage = computed(() => {
  const title = draft.title.trim();
  return title
    ? `"${title}" will be permanently deleted. This action cannot be undone.`
    : 'This task will be permanently deleted. This action cannot be undone.';
});

function parseDisplayDate(value?: string): string {
  if (!value) return '';
  const match = value.match(/(\d{1,2})\s+([A-Za-z]{3})/);
  if (!match) return '';
  const monthIndex = MONTHS.findIndex((month) => month.toLowerCase() === match[2].toLowerCase());
  if (monthIndex < 0) return '';
  const year = new Date().getFullYear();
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(Number(match[1])).padStart(2, '0')}`;
}

function formatCardDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  return `${day} ${MONTHS[month - 1] ?? ''}`.trim();
}

function formatLongDate(iso?: string): string {
  if (!iso) return '';
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return '';
  return `${day} ${MONTHS[month - 1] ?? ''}, ${year}`;
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value >= 10 || index === 0 ? Math.round(value) : value.toFixed(1)} ${units[index]}`;
}

function hydrate() {
  const id = String(props.taskId ?? '');
  if (!id) return;

  assigneeOpen.value = false;
  addingSubtask.value = false;
  newSubtask.value = '';

  if (id === 'new') {
    const fresh = createCard();
    const columnId = String(props.columnId ?? board.columns[0]?.id ?? 'todo');
    Object.assign(draft, {
      id: fresh.id,
      title: '',
      columnId: board.columns.some((column) => column.id === columnId) ? columnId : draft.columnId,
      boardName: board.name,
      members: [],
      dateIso: '',
      tag: 'undefined' as TagType,
      priority: 'medium' as Priority,
      description: '',
      image: '',
      completed: false,
      checklistItems: [],
      attachmentFiles: [],
    });
    originalColumnId.value = undefined;
    originalChecklist.value = undefined;
    originalAttachments.value = undefined;
    editingTitle.value = true;
    nextTick(() => titleInput.value?.focus());
    return;
  }

  const found = findCard(id);
  if (!found) {
    emit('close');
    return;
  }

  const { card, column } = found;
  Object.assign(draft, {
    id: card.id,
    title: card.title,
    columnId: column.id,
    boardName: board.name,
    members: card.members.map((item) => ({ ...item })),
    dateIso: card.dueDate ?? parseDisplayDate(card.date),
    tag: card.tag,
    priority: card.priority ?? 'medium',
    description: card.description ?? '',
    image: card.image ?? '',
    completed: card.completed ?? false,
    checklistItems: (card.checklistItems ?? []).map((item) => ({ ...item })),
    attachmentFiles: (card.attachmentFiles ?? []).map((item) => ({ ...item })),
  });
  originalColumnId.value = column.id;
  originalChecklist.value = card.checklist;
  originalAttachments.value = card.attachments;
  editingTitle.value = false;
}

watch(() => [props.taskId, props.columnId], hydrate, { immediate: true });

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return;
  // The confirm dialog handles its own Escape; don't close the task behind it.
  if (confirmDeleteOpen.value) return;
  if (assigneeOpen.value) {
    assigneeOpen.value = false;
    return;
  }
  discard();
}

function onPointerDown(event: PointerEvent) {
  if (!assigneeOpen.value) return;
  const target = event.target as Node | null;
  if (target && assigneeWrap.value?.contains(target)) return;
  assigneeOpen.value = false;
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
  document.addEventListener('pointerdown', onPointerDown, true);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  document.removeEventListener('pointerdown', onPointerDown, true);
});

function startTitleEdit() {
  editingTitle.value = true;
  nextTick(() => titleInput.value?.focus());
}

function isAssigned(name: string): boolean {
  return draft.members.some((item) => item.name === name);
}

function toggleAssignee(option: KanbanMember) {
  if (isAssigned(option.name)) {
    draft.members = draft.members.filter((item) => item.name !== option.name);
  } else {
    draft.members = [...draft.members, { ...option }];
  }
}

function removeAssignee(member: KanbanMember) {
  draft.members = draft.members.filter((item) => item.name !== member.name);
}

function pickCover() {
  coverInput.value?.click();
}

/** Open the native date picker when clicking anywhere on the Due Date control,
    not just the browser's small calendar indicator. */
function openDatePicker() {
  try {
    dateInput.value?.showPicker();
  } catch {
    // Older browsers without showPicker(): the click on the hidden input still focuses it.
  }
}

function onCoverChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      draft.image = String(reader.result ?? '');
    };
    reader.readAsDataURL(file);
  }
  input.value = '';
}

function addFiles(files: FileList | File[]) {
  for (const file of Array.from(files)) {
    draft.attachmentFiles.push({ id: uid('file'), name: file.name, size: formatBytes(file.size) });
  }
}

function onAttachChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files?.length) addFiles(input.files);
  input.value = '';
}

function onDrop(event: DragEvent) {
  if (event.dataTransfer?.files?.length) addFiles(event.dataTransfer.files);
}

function removeAttachment(id: string) {
  draft.attachmentFiles = draft.attachmentFiles.filter((file) => file.id !== id);
}

function startSubtask() {
  addingSubtask.value = true;
  nextTick(() => subtaskInput.value?.focus());
}

function commitSubtask() {
  const text = newSubtask.value.trim();
  if (text) {
    draft.checklistItems.push({ id: uid('subtask'), text, done: false });
    newSubtask.value = '';
  }
  nextTick(() => subtaskInput.value?.focus());
}

function onSubtaskBlur() {
  if (!newSubtask.value.trim()) {
    addingSubtask.value = false;
    return;
  }
  commitSubtask();
}

function removeSubtask(id: string) {
  draft.checklistItems = draft.checklistItems.filter((item) => item.id !== id);
}

function save() {
  const title = draft.title.trim() || 'Untitled task';
  const hasSubtasks = draft.checklistItems.length > 0;
  const checklist = hasSubtasks ? `${doneSubtasks.value}/${totalSubtasks.value}` : originalChecklist.value;
  const attachments = draft.attachmentFiles.length || originalAttachments.value;

  const card: KanbanCard = {
    id: draft.id,
    title,
    tag: draft.tag,
    members: draft.members.map((item) => ({ ...item })),
    date: formatCardDate(draft.dateIso),
    dueDate: draft.dateIso || undefined,
    image: draft.image || undefined,
    description: draft.description.trim() || undefined,
    priority: draft.priority,
    completed: draft.completed,
    checklist,
    attachments,
    checklistItems: draft.checklistItems.map((item) => ({ ...item })),
    attachmentFiles: draft.attachmentFiles.map((file) => ({ ...file })),
  };

  board.name = draft.boardName;
  upsertCard(card, draft.columnId, originalColumnId.value);
  showToast(originalColumnId.value ? 'Task updated' : 'Task created', 'success');
  emit('close');
}

function discard() {
  emit('close');
}

function removeTask() {
  if (props.taskId === 'new') {
    emit('close');
    return;
  }

  confirmDeleteOpen.value = true;
}

function confirmDelete() {
  confirmDeleteOpen.value = false;
  removeCard(props.taskId);
  showToast('Task deleted', 'success');
  emit('close');
}
</script>

<style scoped>
.task-scroll > :first-child {
  margin-top: 18px;
}

.task-overlay {
  position: absolute;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(17, 24, 39, 0.45);
  backdrop-filter: blur(2px);
}

.task-modal {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 560px;
  max-height: 100%;
  min-height: 0;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.28);
  overflow: hidden;
  color: #111827;
}

.task-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
  padding: 0 22px 24px;
}

.task-scroll::-webkit-scrollbar,
.assignee-menu::-webkit-scrollbar {
  width: 8px;
}

.task-scroll::-webkit-scrollbar-track,
.assignee-menu::-webkit-scrollbar-track {
  background: transparent;
}

.task-scroll::-webkit-scrollbar-thumb,
.assignee-menu::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 999px;
  border: 2px solid transparent;
  background-clip: content-box;
}

.task-scroll::-webkit-scrollbar-thumb:hover,
.assignee-menu::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
  background-clip: content-box;
}

.sheet-head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 22px 14px;
  border-bottom: 1px solid #eef0f4;
}

.complete-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: #eef1f6;
  color: #374151;
  font-size: 14px;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
}

.complete-toggle ion-icon {
  font-size: 18px;
  color: #9ca3af;
}

.complete-toggle.is-active {
  background: #e7f8ef;
  color: #0f766e;
}

.complete-toggle.is-active ion-icon {
  color: #0f766e;
}

.close-btn {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: #eef1f6;
  color: #4b5563;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.close-btn ion-icon {
  font-size: 18px;
}

.head-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.delete-btn {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: #eef1f6;
  color: #6b7280;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.delete-btn:hover {
  background: #fee2e2;
  color: #dc2626;
}

.delete-btn ion-icon {
  font-size: 18px;
}

.cover-add {
  width: 100%;
  height: 118px;
  border: 1px dashed #c3d4f2;
  border-radius: 12px;
  background: #f0f5ff;
  color: #2f6fed;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.cover-add ion-icon {
  font-size: 26px;
}

.cover-preview {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: #f3f4f6;
}

.cover-preview img {
  display: block;
  width: 100%;
  height: 170px;
  object-fit: cover;
}

.cover-remove {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: #374151;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.hidden-input {
  display: none;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 20px 0 22px;
}

.title-text {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: #111827;
  cursor: text;
  min-width: 0;
  overflow-wrap: anywhere;
}

.title-input {
  flex: 1;
  min-width: 0;
  border: none;
  border-bottom: 2px solid #2f6fed;
  background: transparent;
  font-size: 26px;
  font-weight: 700;
  color: #111827;
  padding: 2px 0;
  outline: none;
}

.pencil-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #6b7280;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.pencil-btn:hover {
  background: #eef1f6;
  color: #374151;
}

.pencil-btn ion-icon {
  font-size: 18px;
}

.fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 20px;
}

.field-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.control {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 10px;
  border-radius: 8px;
  background: #eef1f6;
  color: #374151;
  font-size: 13px;
}

.control select {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  font: inherit;
  color: inherit;
  padding: 9px 18px 9px 0;
  outline: none;
  appearance: none;
  cursor: pointer;
}

.caret {
  position: absolute;
  right: 8px;
  font-size: 16px;
  color: #6b7280;
  pointer-events: none;
}

.placeholder {
  color: #9ca3af;
}

.assignee-control {
  gap: 6px;
  min-height: 44px;
}

.assignee-add {
  width: 30px;
  height: 30px;
  margin-left: auto;
  border: none;
  border-radius: 50%;
  background: #dfe6f2;
  color: #2f6fed;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.assignee-add ion-icon {
  font-size: 16px;
}

.assignee-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 20;
  width: min(260px, 100%);
  max-height: 260px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 12px 28px rgba(16, 24, 40, 0.16);
  padding: 6px;
}

.assignee-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  border: none;
  background: transparent;
  padding: 7px 8px;
  border-radius: 8px;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  color: #374151;
  text-align: left;
}

.assignee-option:hover {
  background: #f3f5f9;
}

.assignee-option.selected {
  background: #eef4ff;
  color: #1d4ed8;
}

.option-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.option-name {
  flex: 1;
}

.option-check {
  font-size: 16px;
  color: #2f6fed;
}

.date-control {
  padding-right: 10px;
}

.date-text {
  flex: 1;
  color: #374151;
}

.date-text.placeholder {
  color: #9ca3af;
}

.date-control ion-icon {
  font-size: 16px;
  color: #6b7280;
}

.date-native {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  border: none;
}

.section {
  margin-top: 26px;
  padding-top: 22px;
  border-top: 1px solid #eef0f4;
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.section-title {
  margin: 0 0 12px;
  font-size: 17px;
  font-weight: 700;
  color: #111827;
}

.description-wrap {
  position: relative;
}

.description-placeholder {
  position: absolute;
  top: 14px;
  left: 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #9ca3af;
  font-size: 14px;
  line-height: 1.5;
  pointer-events: none;
}

.description-placeholder ion-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.description-input {
  display: block;
  width: 100%;
  box-sizing: border-box;
  border: none;
  border-radius: 10px;
  background: #eef1f6;
  padding: 14px;
  font: inherit;
  font-size: 14px;
  line-height: 1.5;
  color: #111827;
  resize: vertical;
  min-height: 96px;
  outline: none;
}

.description-input::placeholder {
  color: #9ca3af;
}

.dropzone {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 18px;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  background: #f8fafc;
  color: #64748b;
  font-size: 13px;
  cursor: pointer;
  text-align: center;
}

.dropzone ion-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.dropzone-text strong {
  color: #374151;
}

.or {
  margin: 0 4px;
  color: #94a3b8;
}

.browse {
  color: #2f6fed;
  font-weight: 500;
}

.attachment-list,
.subtask-list {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attachment-item,
.subtask-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #f7f9fc;
  border: 1px solid #eef0f4;
  font-size: 13px;
}

.file-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #374151;
}

.file-size {
  color: #9ca3af;
  font-size: 12px;
}

.row-remove {
  border: none;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  flex-shrink: 0;
}

.row-remove:hover {
  background: #fde8e8;
  color: #dc2626;
}

.row-remove ion-icon {
  font-size: 16px;
}

.checklist-count {
  font-size: 13px;
  color: #6b7280;
}

.progress-track {
  height: 4px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
}

.progress-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #2f6fed;
  transition: width 0.2s ease;
}

.subtask {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  cursor: pointer;
  color: #374151;
}

.subtask input[type='checkbox'] {
  width: 16px;
  height: 16px;
  accent-color: #2f6fed;
  cursor: pointer;
}

.subtask span.done {
  text-decoration: line-through;
  color: #9ca3af;
}

.subtask-input {
  width: 100%;
  box-sizing: border-box;
  margin-top: 12px;
  border: 1px solid #c3d4f2;
  border-radius: 8px;
  background: #ffffff;
  padding: 10px 12px;
  font: inherit;
  font-size: 13px;
  color: #111827;
  outline: none;
}

.add-subtask {
  width: 100%;
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 38px;
  border: none;
  border-radius: 8px;
  background: #eef1f6;
  color: #374151;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.add-subtask:hover {
  background: #e5eaf3;
}

.add-subtask ion-icon {
  font-size: 16px;
}

.empty-state {
  margin: 0;
  color: #9ca3af;
  font-size: 13px;
}

.task-footer {
  flex-shrink: 0;
  border-top: 1px solid #e5e7eb;
  background: #ffffff;
  padding: 12px 22px;
}

.footer-inner {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn {
  border: none;
  border-radius: 8px;
  padding: 9px 22px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-discard {
  background: #eef1f6;
  color: #374151;
}

.btn-discard:hover {
  background: #e5eaf3;
}

.btn-save {
  background: #2f6fed;
  color: #ffffff;
}

.btn-save:hover {
  background: #2559c9;
}

@media (max-width: 720px) {
  .task-overlay {
    padding: 12px;
  }

  .task-scroll {
    padding: 0 16px 24px;
  }

  .sheet-head {
    padding: 14px 16px 12px;
  }

  .fields {
    grid-template-columns: minmax(0, 1fr);
    gap: 14px;
  }

  .title-text,
  .title-input {
    font-size: 22px;
  }

  .task-footer {
    padding: 10px 16px;
  }
}
</style>
