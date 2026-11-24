<template>
  <div class="board-shell">
    <header ref="headerAnchor" class="board-topbar">
      <div class="board-topbar-bar">
        <button type="button" class="board-brand" aria-label="Change visibility" @click="visibilityOpen = true">
          <ion-icon :icon="visibilityIcon" class="brand-lock" aria-hidden="true" />
          <span class="brand-name">Adhivasindo</span>
          <ion-icon :icon="chevronDownOutline" aria-hidden="true" />
        </button>

        <button
          type="button"
          class="menu-toggle"
          aria-label="Open menu"
          :aria-expanded="mobileMenuOpen"
          aria-controls="board-mobile-menu"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <ion-icon :icon="mobileMenuOpen ? closeOutline : menuOutline" aria-hidden="true" />
        </button>
      </div>

      <div id="board-mobile-menu" class="board-collapsible" :class="{ 'is-open': mobileMenuOpen }">
        <div class="board-members">
          <KanbanMembers :members="members" />

          <button type="button" class="invite-btn" @click="inviteOpen = true">
            <svg
              class="invite-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M15 18.5v-1.25A3.25 3.25 0 0 0 11.75 14h-4.5A3.25 3.25 0 0 0 4 17.25v1.25" />
              <circle cx="9.5" cy="7.75" r="2.75" />
              <path d="M17.5 8.5v5M15 11h5" />
            </svg>
            Invite
          </button>
        </div>

        <div class="board-right">
          <div ref="filterAnchor" class="filter-anchor">
            <button
              type="button"
              class="toolbar-btn"
              :class="{ 'is-active': !!activeTag }"
              :aria-expanded="filterOpen"
              @click="filterOpen = !filterOpen"
            >
              <ion-icon :icon="funnelOutline" aria-hidden="true" />
              <span>Filter</span>
            </button>
            <div v-if="filterOpen" class="filter-pop" role="menu">
              <p class="filter-title">Filter by label</p>
              <button
                v-for="option in tagOptions"
                :key="option.value"
                type="button"
                class="filter-option"
                :class="{ selected: activeTag === option.value }"
                role="menuitemcheckbox"
                :aria-checked="activeTag === option.value"
                @click="toggleTag(option.value)"
              >
                <span>{{ option.label }}</span>
                <ion-icon
                  v-if="activeTag === option.value"
                  :icon="checkmarkOutline"
                  class="option-check"
                  aria-hidden="true"
                />
              </button>
              <button v-if="activeTag" type="button" class="filter-clear" @click="activeTag = null">
                Clear filter
              </button>
            </div>
          </div>
          <button type="button" class="toolbar-btn" @click="exportImportOpen = true">
            <svg
              class="toolbar-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M8 7v10" />
              <path d="M5.5 14.5 8 17l2.5-2.5" />
              <path d="M16 17V7" />
              <path d="M13.5 9.5 16 7l2.5 2.5" />
            </svg>
            <span>Export / Import</span>
          </button>
          <label class="search-box">
            <ion-icon :icon="searchOutline" aria-hidden="true" />
            <input v-model="searchQuery" type="text" placeholder="Search Tasks" aria-label="Search Tasks" />
            <button
              v-if="searchQuery"
              type="button"
              class="search-clear"
              aria-label="Clear search"
              @click="searchQuery = ''"
            >
              <ion-icon :icon="closeOutline" aria-hidden="true" />
            </button>
          </label>
        </div>
      </div>
    </header>

    <div class="board-columns" role="list" aria-label="Kanban columns">
      <KanbanColumn
        v-for="column in visibleColumns"
        :key="column.id"
        :column="column"
        @add-card="emit('add-card', $event)"
        @select-card="emit('select-card', $event)"
        @delete-card="emit('delete-card', $event)"
        @drop-card="emit('drop-card', $event)"
        @delete-column="deleteColumn"
      />

      <button type="button" class="add-list-column" aria-label="Add new list" @click="addListOpen = true">
        <ion-icon :icon="addOutline" aria-hidden="true" />
        Add new List
      </button>
    </div>

    <ConfirmDialog
      :open="!!pendingDeleteColumnId"
      danger
      title="Delete column?"
      :message="deleteColumnMessage"
      confirm-text="Delete"
      cancel-text="Cancel"
      @confirm="confirmDeleteColumn"
      @cancel="pendingDeleteColumnId = null"
    />

    <InviteShareModal :open="inviteOpen" @close="inviteOpen = false" />

    <ChangeVisibilityModal
      :open="visibilityOpen"
      :visibility="boardVisibility"
      @close="visibilityOpen = false"
      @change="boardVisibility = $event"
    />

    <ExportImportModal :open="exportImportOpen" @close="exportImportOpen = false" />

    <AddListModal :open="addListOpen" @close="addListOpen = false" @create="createList" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { IonIcon } from '@ionic/vue';
import {
  addOutline,
  checkmarkOutline,
  chevronDownOutline,
  closeOutline,
  funnelOutline,
  globeOutline,
  lockClosedOutline,
  menuOutline,
  peopleOutline,
  searchOutline,
} from 'ionicons/icons';
import KanbanColumn from './KanbanColumn.vue';
import KanbanMembers from './KanbanMembers.vue';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';
import InviteShareModal from '@/components/ui/InviteShareModal.vue';
import ChangeVisibilityModal from '@/components/ui/ChangeVisibilityModal.vue';
import ExportImportModal from '@/components/ui/ExportImportModal.vue';
import AddListModal from '@/components/ui/AddListModal.vue';
import { showToast } from '@/composables/useToast';
import { addColumn, removeColumn } from '@/stores/storage';
import type { KanbanCard, KanbanColumn as Column, KanbanMember, TagType } from '@/types/kanban';

type BoardVisibility = 'private' | 'workspace' | 'public';

const props = defineProps<{
  columns: Column[];
  members: KanbanMember[];
}>();

const emit = defineEmits<{
  (e: 'add-card', columnId: string): void;
  (e: 'select-card', card: KanbanCard): void;
  (e: 'delete-card', card: KanbanCard): void;
  (e: 'drop-card', payload: { cardId: string; columnId: string; index: number }): void;
}>();

const searchQuery = ref('');
const activeTag = ref<TagType | null>(null);
const filterOpen = ref(false);
const mobileMenuOpen = ref(false);
const pendingDeleteColumnId = ref<string | null>(null);
const inviteOpen = ref(false);
const visibilityOpen = ref(false);
const exportImportOpen = ref(false);
const addListOpen = ref(false);
const boardVisibility = ref<BoardVisibility>('private');

const visibilityIcon = computed(() => {
  if (boardVisibility.value === 'workspace') return peopleOutline;
  if (boardVisibility.value === 'public') return globeOutline;
  return lockClosedOutline;
});

const tagOptions: { value: TagType; label: string }[] = [
  { value: 'feature', label: 'Feature' },
  { value: 'bug', label: 'Bug' },
  { value: 'issue', label: 'Issue' },
  { value: 'undefined', label: 'Task' },
];

const columns = computed(() => props.columns);

const visibleColumns = computed<Column[]>(() =>
  columns.value.map((column) => ({
    ...column,
    cards: column.cards.filter((card) => {
      const query = searchQuery.value.trim().toLowerCase();
      const matchesQuery =
        !query || card.title.toLowerCase().includes(query) || (card.description ?? '').toLowerCase().includes(query);
      const matchesTag = !activeTag.value || card.tag === activeTag.value;
      return matchesQuery && matchesTag;
    }),
  })),
);

function createList(title: string) {
  const created = addColumn(title);
  if (created) {
    showToast('List added');
  }
}

function toggleTag(value: TagType) {
  activeTag.value = activeTag.value === value ? null : value;
}

function deleteColumn(columnId: string) {
  pendingDeleteColumnId.value = columnId;
}

const deleteColumnMessage = computed(() => {
  const column = props.columns.find((item) => item.id === pendingDeleteColumnId.value);
  const title = column?.title.trim();
  const count = column?.cards.length ?? 0;
  const countLabel = count === 1 ? '1 task' : `${count} tasks`;

  if (title) {
    return `"${title}" and its ${countLabel} will be permanently deleted. This action cannot be undone.`;
  }
  return `This column and its ${countLabel} will be permanently deleted. This action cannot be undone.`;
});

function confirmDeleteColumn() {
  const columnId = pendingDeleteColumnId.value;
  pendingDeleteColumnId.value = null;
  if (!columnId) return;

  if (removeColumn(columnId)) {
    showToast('Column deleted', 'success');
  }
}

const filterAnchor = ref<HTMLElement | null>(null);
const headerAnchor = ref<HTMLElement | null>(null);

function onDocumentPointerDown(event: PointerEvent) {
  const target = event.target as Node | null;
  if (filterAnchor.value && target && !filterAnchor.value.contains(target)) {
    filterOpen.value = false;
  }
  if (headerAnchor.value && target && !headerAnchor.value.contains(target)) {
    mobileMenuOpen.value = false;
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    filterOpen.value = false;
    mobileMenuOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown);
  window.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown);
  window.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>
.board-shell {
  flex: 1 1 auto;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  color: #111827;
  overflow: hidden;
}

.board-topbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  background: #ffffff;
  border-bottom: 1px solid #e8ebf2;
}

.board-topbar-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.menu-toggle {
  display: none;
  border: 1px solid #e5e7eb;
  background: #eef1f7;
  color: #374151;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
}

.menu-toggle ion-icon {
  font-size: 22px;
}

.menu-toggle:hover {
  background: #e5e9f2;
}

.board-collapsible {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex: 1 1 auto;
  min-width: 0;
}

.board-members,
.board-right {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.board-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: none;
  background: transparent;
  padding: 4px 6px;
  cursor: pointer;
  color: #111827;
  font: inherit;
}

.brand-lock {
  font-size: 16px;
  color: #374151;
  flex-shrink: 0;
}

.brand-name {
  font-size: 16px;
}

.board-members {
  display: flex;
  align-items: center;
  gap: 8px;
}

.invite-btn,
.toolbar-btn,
.primary-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  color: #374151;
  padding: 6px 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.invite-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #eef1f7;
  color: #374151;
  padding: 6px 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.primary-btn {
  background: #0f766e;
  color: #fff;
  border-color: #0f766e;
}

.toolbar-btn ion-icon,
.primary-btn ion-icon,
.invite-btn ion-icon {
  font-size: 16px;
}

.filter-anchor {
  position: relative;
}

.filter-pop {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 40;
  min-width: 180px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 12px 28px rgba(16, 24, 40, 0.16);
  padding: 8px;
}

.filter-title {
  margin: 0 0 6px;
  padding: 0 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #6b7280;
}

.filter-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  border: none;
  background: transparent;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  color: #374151;
  text-align: left;
}

.filter-option:hover {
  background: #f3f5f9;
}

.filter-option.selected {
  background: #eef4ff;
  color: #1d4ed8;
}

.option-check {
  font-size: 16px;
  color: #2f6fed;
}

.filter-clear {
  width: 100%;
  margin-top: 6px;
  border: none;
  border-top: 1px solid #eef0f4;
  background: transparent;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  color: #dc2626;
}

.filter-clear:hover {
  background: #fef2f2;
}

.search-clear {
  border: none;
  background: transparent;
  color: #9ca3af;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
}

.search-clear:hover {
  color: #374151;
  background: #e5e7eb;
}

.toolbar-btn.is-active {
  background: #eef4ff;
  color: #1d4ed8;
}

.invite-icon,
.toolbar-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.search-box {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #e5e7eb;
  background: #eef1f7;
  border-radius: 10px;
  padding: 8px 12px;
  min-width: 220px;
  color: #9ca3af;
}

.search-box input {
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
  font-size: 13px;
  color: #111827;
}

.board-columns {
  flex: 1;
  min-height: 0;
  overflow-x: auto;
  overflow-y: hidden;
  display: flex;
  align-items: stretch;
  gap: 18px;
  padding: 18px 20px 24px;
}

.add-list-column {
  flex: 0 0 220px;
  align-self: flex-start;
  height: 48px;
  margin-top: 2px;
  border: 1px dashed #cfd6e4;
  border-radius: 12px;
  background: #eef1f7;
  color: #4b5563;
  font-size: 14px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
}

.add-list-column ion-icon {
  font-size: 18px;
}

@media (max-width: 900px) {
  .board-topbar {
    position: relative;
    flex-wrap: wrap;
    gap: 0;
  }

  .board-topbar-bar {
    width: 100%;
    justify-content: space-between;
  }

  .menu-toggle {
    display: inline-flex;
  }

  .board-collapsible {
    display: none;
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #e8ebf2;
  }

  .board-collapsible.is-open {
    display: flex;
  }

  .board-members {
    width: 100%;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .board-members .invite-btn {
    width: auto;
    flex-shrink: 0;
    justify-content: center;
  }

  .board-right {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: stretch;
    gap: 10px;
  }

  .board-right .filter-anchor,
  .board-right > .toolbar-btn {
    flex: 1 1 calc(50% - 5px);
    min-width: 0;
  }

  .board-right .filter-anchor > .toolbar-btn,
  .board-right > .toolbar-btn {
    width: 100%;
    justify-content: center;
  }

  .filter-pop {
    right: auto;
    left: 0;
    width: 100%;
  }

  .search-box {
    flex: 1 1 100%;
    min-width: 0;
    width: 100%;
  }
}
</style>
