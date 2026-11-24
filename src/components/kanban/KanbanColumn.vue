<template>
  <section
    class="kanban-column"
    :class="{ 'is-drag-over': dragOver, 'is-collapsed': collapsed }"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
    @dragend="resetDrag"
  >
    <header class="column-header">
      <div class="column-title-wrap">
        <h2 class="column-title">{{ column.title }}</h2>
        <button
          type="button"
          class="icon-btn icon-btn-primary"
          title="Add card"
          aria-label="Add card"
          @click="emit('add-card', column.id)"
        >
          <ion-icon :icon="addOutline" aria-hidden="true" />
        </button>
        <div ref="menuAnchor" class="column-menu-anchor">
          <button
            type="button"
            class="icon-btn"
            :aria-label="columnMenuOpen ? 'Close column menu' : 'Column menu'"
            :aria-expanded="columnMenuOpen"
            @click="columnMenuOpen = !columnMenuOpen"
          >
            <ion-icon :icon="ellipsisVerticalOutline" aria-hidden="true" />
          </button>
          <div v-if="columnMenuOpen" class="column-menu" role="menu">
            <button type="button" class="menu-item" role="menuitem" @click="requestDeleteColumn">Delete column</button>
          </div>
        </div>
      </div>

      <div class="column-actions">
        <span class="column-count">{{ column.cards.length }}</span>
        <button
          type="button"
          class="icon-btn"
          title="Collapse/Expand"
          :class="{ 'icon-btn-primary': !collapsed }"
          :aria-label="collapsed ? 'Expand column' : 'Collapse column'"
          @click="toggleCollapsed"
        >
          <ion-icon :icon="collapsed ? expandOutline : contractOutline" aria-hidden="true" />
        </button>
      </div>
    </header>
    <div ref="cardsEl" class="column-cards" :class="{ 'is-collapsed': collapsed }">
      <template v-for="(card, index) in column.cards" :key="card.id">
        <div v-if="dragOver && dragIndex === index" class="drop-line" aria-hidden="true" />
        <KanbanCard :card="card" @open="emit('select-card', $event)" @delete="emit('delete-card', $event)" />
      </template>
      <div v-if="dragOver && dragIndex >= column.cards.length" class="drop-line" aria-hidden="true" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { IonIcon } from '@ionic/vue';
import { addOutline, contractOutline, ellipsisVerticalOutline, expandOutline } from 'ionicons/icons';
import type { KanbanCard as KanbanCardModel, KanbanColumn } from '@/types/kanban';
import KanbanCard from './KanbanCard.vue';
import { CARD_DRAG_TYPE, draggingCardId, isCardDrag } from './dragTypes';
import { collapsedColumns, toggleColumnCollapsed } from '@/stores/storage';

const props = defineProps<{
  column: KanbanColumn;
}>();

const emit = defineEmits<{
  (e: 'add-card', columnId: string): void;
  (e: 'select-card', card: KanbanCardModel): void;
  (e: 'delete-card', card: KanbanCardModel): void;
  (e: 'drop-card', payload: { cardId: string; columnId: string; index: number }): void;
  (e: 'delete-column', columnId: string): void;
}>();

const cardsEl = ref<HTMLElement | null>(null);
const dragOver = ref(false);
const dragIndex = ref(0);
const columnMenuOpen = ref(false);
const menuAnchor = ref<HTMLElement | null>(null);

const collapsed = computed(() => collapsedColumns.value.has(props.column.id));

function toggleCollapsed() {
  toggleColumnCollapsed(props.column.id);
}

function closeColumnMenu() {
  columnMenuOpen.value = false;
}

function requestDeleteColumn() {
  closeColumnMenu();
  emit('delete-column', props.column.id);
}

function onDocumentPointerDown(event: PointerEvent) {
  const target = event.target as Node | null;
  if (columnMenuOpen.value && menuAnchor.value && target && !menuAnchor.value.contains(target)) {
    closeColumnMenu();
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeColumnMenu();
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown);
  window.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown);
  window.removeEventListener('keydown', onKeydown);
});

function resetDrag() {
  dragOver.value = false;
  dragIndex.value = 0;
}

/** Insertion index based on the pointer position over the cards. */
function computeIndex(event: DragEvent): number {
  const container = cardsEl.value;
  if (!container) return props.column.cards.length;

  const cards = Array.from(container.querySelectorAll<HTMLElement>(':scope > .kanban-card'));
  for (let index = 0; index < cards.length; index += 1) {
    const rect = cards[index].getBoundingClientRect();
    if (event.clientY < rect.top + rect.height / 2) return index;
  }
  return cards.length;
}

function onDragOver(event: DragEvent) {
  if (!isCardDrag(event)) return;

  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  dragOver.value = true;
  dragIndex.value = computeIndex(event);
}

function onDragLeave(event: DragEvent) {
  const related = event.relatedTarget as Node | null;
  if (related && (event.currentTarget as HTMLElement | null)?.contains(related)) return;
  resetDrag();
}

function onDrop(event: DragEvent) {
  const cardId = draggingCardId.value ?? event.dataTransfer?.getData(CARD_DRAG_TYPE) ?? '';
  // Recompute from the drop position so we don't depend on the last dragover
  // update (which can be missed or stale in fast drags / cross-column moves).
  const index = computeIndex(event);

  draggingCardId.value = null;
  resetDrag();

  if (!cardId) return;
  emit('drop-card', { cardId, columnId: props.column.id, index });
}
</script>

<style scoped>
.kanban-column {
  flex: 0 0 320px;
  width: 320px;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  min-height: 0;
}

.column-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 4px 14px;
}

.column-title-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.column-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.column-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon-btn {
  border: none;
  background: transparent;
  color: #6b7280;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
}

.icon-btn:hover {
  background: #eef2f7;
  color: #374151;
}

.icon-btn-primary {
  background: #e6edf8;
  color: #1168da;
}

.icon-btn-primary:hover {
  background: #eef2f7;
  color: #2766b8;
}

.icon-btn ion-icon {
  font-size: 18px;
}

.column-cards {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
  /* Keep vertical scroll contained within the column, but let horizontal
     wheel/Shift+wheel chain to the board's horizontal scroller. */
  overscroll-behavior: auto contain;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
  padding: 0 2px 8px;
  min-height: 0;
}

.kanban-column.is-drag-over {
  outline: 2px dashed rgba(47, 111, 237, 0.45);
  outline-offset: 2px;
  border-radius: 12px;
  background: rgba(47, 111, 237, 0.03);
}

.drop-line {
  flex-shrink: 0;
  height: 4px;
  border-radius: 999px;
  background: #2f6fed;
  box-shadow: 0 0 0 3px rgba(47, 111, 237, 0.12);
  pointer-events: none;
}

/* Kartu tidak boleh menyusut saat kolom penuh. Tanpa ini flex akan
   mengecilkan kartu agar muat, sehingga overflow-y tidak pernah aktif. */
.column-cards > * {
  flex-shrink: 0;
}

.column-cards::-webkit-scrollbar {
  width: 8px;
}

.column-cards::-webkit-scrollbar-track {
  background: transparent;
}

.column-cards::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 999px;
  border: 2px solid transparent;
  background-clip: content-box;
}

.column-cards::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
  background-clip: content-box;
}

.column-menu-anchor {
  position: relative;
}

.column-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 40;
  min-width: 180px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 12px 28px rgba(16, 24, 40, 0.16);
  padding: 6px;
}

.column-menu .menu-item {
  display: block;
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

.column-menu .menu-item:hover {
  background: #f3f5f9;
}

.column-menu .menu-item:disabled {
  opacity: 0.45;
  cursor: default;
  background: transparent;
}

@media (max-width: 768px) {
  .kanban-column {
    flex-basis: 290px;
    width: 290px;
  }

  .kanban-column.is-collapsed {
    flex-basis: 52px;
    width: 52px;
  }
}

.kanban-column.is-collapsed {
  flex: 0 0 60px;
  width: 60px;
}

/* Collapsed column renders as a narrow vertical strip. */
.kanban-column.is-collapsed .column-header {
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  padding: 14px 4px;
}

.kanban-column.is-collapsed .column-title-wrap {
  flex-direction: column;
  gap: 12px;
}

.kanban-column.is-collapsed .column-title {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 16px;
  max-height: 200px;
  overflow: hidden;
}

.kanban-column.is-collapsed .column-title-wrap .icon-btn:not(.icon-btn-primary) {
  display: none;
}

.kanban-column.is-collapsed .column-actions {
  flex-direction: column-reverse;
}

.kanban-column.is-collapsed .column-cards {
  display: none;
}
</style>
