import { ref } from 'vue';

/** Custom MIME type used to carry a card id during drag & drop. */
export const CARD_DRAG_TYPE = 'application/x-kanban-card';

/**
 * The card currently being dragged.
 * Kept in module state (not only in dataTransfer) because some browsers hide
 * custom MIME types during `dragover`, and because it makes the drop handler
 * work even if the dataTransfer payload is empty.
 */
export const draggingCardId = ref<string | null>(null);

export function isCardDrag(event: DragEvent): boolean {
  if (draggingCardId.value) return true;
  const types = event.dataTransfer?.types;
  if (!types) return false;
  return Array.from(types).includes(CARD_DRAG_TYPE);
}
