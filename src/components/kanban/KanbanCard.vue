<template>
  <article
    class="kanban-card"
    :class="{ 'is-complete': card.completed, 'is-dragging': dragging }"
    role="button"
    tabindex="0"
    draggable="true"
    @click="emit('open', card)"
    @keydown.enter.prevent="emit('open', card)"
    @keydown.space.prevent="emit('open', card)"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
  >
    <button
      type="button"
      class="card-delete"
      aria-label="Delete card"
      title="Delete card"
      @click.stop="emit('delete', card)"
      @keydown.enter.stop.prevent="emit('delete', card)"
      @keydown.space.stop.prevent="emit('delete', card)"
    >
      <ion-icon :icon="trashOutline" aria-hidden="true" />
    </button>

    <div v-if="card.image" class="card-cover">
      <img :src="card.image" :alt="card.title" />
    </div>

    <div class="card-body">
      <span class="tag" :class="`tag-${card.tag}`">{{ card.tagLabel ?? defaultTagLabel }}</span>
      <div
        v-if="checklistProgress"
        class="card-progress"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="checklistProgress.pct"
        :aria-label="`${checklistProgress.done}/${checklistProgress.total} subtasks completed`"
      >
        <span
          class="card-progress-fill"
          :class="{ 'is-complete': checklistProgress.pct === 100 }"
          :style="{ width: `${checklistProgress.pct}%` }"
        />
      </div>
      <h3 class="card-title">{{ card.title }}</h3>
      <div class="card-meta">
        <div class="meta-left">
          <span v-if="card.date" class="meta-pill date-pill">
            <ion-icon :icon="stopwatchOutline" aria-hidden="true" />
            {{ card.date }}
          </span>
          <span v-if="card.checklist" class="meta-item">
            <ion-icon :icon="checkboxOutline" aria-hidden="true" />
            {{ card.checklist }}
          </span>
          <span v-if="card.attachments !== undefined" class="meta-item">
            <ion-icon :icon="attachOutline" aria-hidden="true" />
            {{ card.attachments }}
          </span>
        </div>
        <KanbanMembers :members="card.members" />
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { IonIcon } from '@ionic/vue';
import { attachOutline, checkboxOutline, stopwatchOutline, trashOutline } from 'ionicons/icons';
import KanbanMembers from './KanbanMembers.vue';
import { CARD_DRAG_TYPE, draggingCardId } from './dragTypes';
import type { KanbanCard } from '@/types/kanban';

const props = defineProps<{
  card: KanbanCard;
}>();

const emit = defineEmits<{
  (e: 'open', card: KanbanCard): void;
  (e: 'delete', card: KanbanCard): void;
  (e: 'drag-start', card: KanbanCard): void;
  (e: 'drag-end'): void;
}>();

const dragging = ref(false);

function onDragStart(event: DragEvent) {
  if (!event.dataTransfer) return;

  event.dataTransfer.setData(CARD_DRAG_TYPE, props.card.id);
  event.dataTransfer.setData('text/plain', props.card.id);
  event.dataTransfer.effectAllowed = 'move';

  draggingCardId.value = props.card.id;
  dragging.value = true;
  emit('drag-start', props.card);
}

function onDragEnd() {
  dragging.value = false;
  draggingCardId.value = null;
  emit('drag-end');
}

const defaultTagLabel = computed(() => {
  const labels: Record<string, string> = {
    feature: 'Feature',
    bug: 'Bug',
    issue: 'Issue',
    undefined: 'Undefined',
  };
  return labels[props.card.tag] ?? 'Task';
});

/** Progress of the card's checklist, from structured items or the legacy "done/total" label. */
const checklistProgress = computed(() => {
  const items = props.card.checklistItems;
  if (items?.length) {
    const done = items.filter((item) => item.done).length;
    return { done, total: items.length, pct: Math.round((done / items.length) * 100) };
  }

  const match = props.card.checklist?.match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) return null;

  const done = Number(match[1]);
  const total = Number(match[2]);
  return {
    done,
    total,
    pct: total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0,
  };
});
</script>

<style scoped>
.kanban-card {
  position: relative;
  background: rgb(234, 244, 245);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
  cursor: grab;
  /* Keep the whole card as the drag source: dragging text would otherwise
     start a text-selection drag in some browsers. */
  user-select: none;
  -webkit-user-drag: element;
  transition:
    box-shadow 0.15s ease,
    transform 0.15s ease;
}

.kanban-card:active {
  cursor: grabbing;
}

.card-delete {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.92);
  color: #6b7280;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(16, 24, 40, 0.18);
  opacity: 0;
  transform: scale(0.9);
  transition:
    opacity 0.15s ease,
    transform 0.15s ease,
    background 0.15s ease,
    color 0.15s ease;
}

.card-delete ion-icon {
  font-size: 16px;
  pointer-events: none;
}

.kanban-card:hover .card-delete,
.card-delete:focus-visible {
  opacity: 1;
  transform: scale(1);
}

.card-delete:hover {
  background: #fee2e2;
  color: #dc2626;
}

/* Touch devices have no hover: keep the delete button visible. */
@media (hover: none) {
  .card-delete {
    opacity: 1;
    transform: scale(1);
  }
}

.kanban-card:hover {
  box-shadow: 0 6px 16px rgba(16, 24, 40, 0.12);
}

.kanban-card:focus-visible {
  outline: 2px solid #1168da;
  outline-offset: 2px;
}

.kanban-card.is-dragging {
  opacity: 0.45;
}

.kanban-card.is-complete .card-title {
  text-decoration: line-through;
  color: #9ca3af;
}

.kanban-card.is-complete {
  opacity: 0.85;
}

.card-cover {
  height: 132px;
  overflow: hidden;
  background: #f3f4f6;
}

.card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.card-body {
  padding: 14px 14px 12px;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  margin-bottom: 10px;
}

.tag-feature {
  color: #0054e9;
  background: #ecfdf5;
  border: 1px solid #99f6e4;
}

.tag-bug {
  color: #c5000f;
  background: #fff1f2;
  border: 1px solid #fecdd3;
}

.tag-issue {
  color: #a58725;
  background: #fff9f3;
  border: 1px solid #da9c5f;
}

.tag-undefined {
  color: #5f5f5f;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.card-title {
  margin: 0 0 14px;
  font-size: 15px;
  line-height: 1.5;
  color: #111827;
}

.card-progress {
  height: 5px;
  margin-bottom: 10px;
  border-radius: 999px;
  background: #dbe7ea;
  overflow: hidden;
}

.card-progress-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #2f6fed;
  transition:
    width 0.25s ease,
    background 0.25s ease;
}

.card-progress-fill.is-complete {
  background: #10b981;
}

.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.meta-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  color: #6b7280;
  font-size: 12px;
}

.meta-item,
.meta-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.meta-pill {
  padding: 4px 8px;
  background: #cef8e4;
  color: #2e5b9b;
  border-radius: 8px;
  border-color: #2d4880;
  font-weight: 500;
}

.meta-left ion-icon {
  font-size: 14px;
}
</style>
