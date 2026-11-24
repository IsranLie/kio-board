<template>
  <ion-page>
    <ion-content :fullscreen="true" :scroll-y="false" class="kanban-content">
      <KanbanBoard
        :columns="board.columns"
        :members="board.members"
        @add-card="openNewTask"
        @select-card="openTask"
        @delete-card="deleteTask"
        @drop-card="dropTask"
      />
    </ion-content>

    <KanbanTaskPage v-if="activeTaskId" :task-id="activeTaskId" :column-id="newTaskColumn" @close="closeTask" />

    <ConfirmDialog
      :open="!!pendingDelete"
      danger
      title="Delete task?"
      :message="deleteMessage"
      confirm-text="Delete"
      cancel-text="Cancel"
      @confirm="confirmDelete"
      @cancel="pendingDelete = null"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { IonContent, IonPage } from '@ionic/vue';
import { useRoute, useRouter } from 'vue-router';
import KanbanBoard from '@/components/kanban/KanbanBoard.vue';
import KanbanTaskPage from '@/views/KanbanTaskPage.vue';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';
import { showToast } from '@/composables/useToast';
import { board, moveCard, removeCard } from '@/stores/storage';
import type { KanbanCard } from '@/types/kanban';

const route = useRoute();
const router = useRouter();

const activeTaskId = computed(() => (route.query.task ? String(route.query.task) : ''));
const newTaskColumn = computed(() => (route.query.column ? String(route.query.column) : undefined));

const pendingDelete = ref<KanbanCard | null>(null);

const deleteMessage = computed(() => {
  const title = pendingDelete.value?.title.trim();
  return title
    ? `"${title}" will be permanently deleted. This action cannot be undone.`
    : 'This task will be permanently deleted. This action cannot be undone.';
});

function openNewTask(columnId: string) {
  router.push({ query: { task: 'new', column: columnId } });
}

function openTask(card: KanbanCard) {
  router.push({ query: { task: card.id } });
}

function deleteTask(card: KanbanCard) {
  pendingDelete.value = card;
}

function confirmDelete() {
  const card = pendingDelete.value;
  pendingDelete.value = null;
  if (!card) return;

  removeCard(card.id);
  showToast('Task deleted', 'success');
}

function dropTask(payload: { cardId: string; columnId: string; index: number }) {
  const source = board.columns.find((column) => column.cards.some((card) => card.id === payload.cardId));
  const target = board.columns.find((column) => column.id === payload.columnId);
  const movedToAnotherColumn = !!source && !!target && source.id !== target.id;

  if (!moveCard(payload.cardId, payload.columnId, payload.index)) return;

  if (movedToAnotherColumn && target) {
    showToast(`Task moved to ${target.title}`, 'success');
  }
}

function closeTask() {
  router.push({ query: {} });
}
</script>

<style scoped>
.kanban-content {
  --overflow: hidden;
}

.kanban-content::part(scroll) {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
</style>
