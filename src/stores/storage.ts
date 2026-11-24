import { Drivers, Storage } from '@ionic/storage';
import { reactive, ref } from 'vue';

import type { KanbanCard, KanbanColumn, KanbanMember } from '@/types/kanban';

export const STORAGE_NAME = 'kio_board_db';

/** Key inside the Ionic Storage database. */
export const BOARD_STORAGE_KEY = 'board:v1';

/** Key for UI-only state (collapsed columns etc.), kept separate from board data. */
export const UI_STORAGE_KEY = 'board:ui:v1';

export const storage = new Storage({
  name: STORAGE_NAME,
  driverOrder: [Drivers.IndexedDB, Drivers.LocalStorage],
});

/** Key used by the previous raw-localStorage implementation, kept only for migration. */
const LEGACY_STORAGE_KEY = 'kio-board:board:v1';

export interface KanbanBoardState {
  name: string;
  members: KanbanMember[];
  columns: KanbanColumn[];
}

const member = (name: string, initials: string, color: string): KanbanMember => ({
  name,
  initials,
  color,
});

const seed: KanbanBoardState = {
  name: 'Adhivasindo',
  members: [
    member('Anna', 'A', '#14b8a6'),
    member('Ben', 'B', '#3b82f6'),
    member('Chris', 'C', '#f59e0b'),
    member('Dina', 'D', '#8b5cf6'),
    member('Eldie', 'E', '#f65cd0'),
    member('Finn', 'F', '#5cf669'),
  ],
  columns: [
    {
      id: 'todo',
      title: 'To do',
      cards: [
        {
          id: 't1',
          tag: 'feature',
          title: 'Research for a podcast and video website',
          date: '8 Aug',
          attachments: 2,
          members: [member('Anna', 'A', '#14b8a6'), member('Ben', 'B', '#3b82f6')],
        },
        {
          id: 't2',
          tag: 'bug',
          title: 'Debug checkout process for the e-commerce website',
          checklist: '10/19',
          attachments: 5,
          members: [member('Chris', 'C', '#8b5cf6'), member('Dina', 'D', '#f59e0b')],
        },
        {
          id: 't3',
          tag: 'issue',
          title: 'Install and set up a marketing tool for the operations',
          image: '/images/task.svg',
          checklist: '12/20',
          attachments: 3,
          members: [member('Evan', 'E', '#ef4444'), member('Faye', 'F', '#06b6d4'), member('Gus', 'G', '#22c55e')],
        },
      ],
    },
    {
      id: 'doing',
      title: 'Doing',
      cards: [
        {
          id: 'd1',
          tag: 'feature',
          title: 'Design wireframes for the landing page revamp',
          date: '12 Aug',
          attachments: 1,
          members: [
            member('Anna', 'A', '#14b8a6'),
            member('Mia', 'M', '#ec4899'),
            member('Faye', 'F', '#06b6d4'),
            member('Anna', 'A', '#14b8a6'),
            member('Evan', 'E', '#ef4444'),
          ],
        },
        {
          id: 'd2',
          tag: 'undefined',
          title: 'Install and set up a marketing tool for the operations',
          image: '/images/domain.svg',
          date: '14 Aug',
          checklist: '12/20',
          attachments: 4,
          members: [member('Chris', 'C', '#8b5cf6'), member('Dina', 'D', '#f59e0b'), member('Gus', 'G', '#22c55e')],
        },
      ],
    },
    {
      id: 'review',
      title: 'Review',
      cards: [
        {
          id: 'r1',
          tag: 'issue',
          title: 'Create and refine logo designs for the UI brand',
          image: '/images/code.svg',
          date: '9 Aug',
          attachments: 6,
          members: [member('Ben', 'B', '#3b82f6'), member('Faye', 'F', '#06b6d4')],
        },
        {
          id: 'r2',
          tag: 'feature',
          title: 'Create an icon library for the project.',
          date: '8 Aug',
          checklist: '7/16',
          attachments: 2,
          members: [member('Anna', 'A', '#14b8a6'), member('Mia', 'M', '#ec4899')],
        },
      ],
    },
    {
      id: 'done',
      title: 'Done',
      cards: [
        {
          id: 'dn1',
          tag: 'feature',
          title: 'Create the Email Page layout and necessary components',
          attachments: 3,
          members: [member('Chris', 'C', '#8b5cf6'), member('Evan', 'E', '#ef4444')],
        },
        {
          id: 'dn2',
          tag: 'feature',
          title: 'Enhance website usability through user feedback',
          attachments: 1,
          members: [member('Ben', 'B', '#3b82f6'), member('Dina', 'D', '#f59e0b')],
        },
        {
          id: 'dn3',
          tag: 'feature',
          title: 'Enhance website usability through user feedback',
          image: '/images/studio.svg',
          attachments: 4,
          members: [member('Faye', 'F', '#06b6d4'), member('Gus', 'G', '#22c55e')],
        },
      ],
    },
    {
      id: 'rework',
      title: 'Rework',
      cards: [
        {
          id: 'rw1',
          tag: 'feature',
          title: 'Blog Edit Page Modification and Playlist Page Design',
          date: '8 Aug',
          checklist: '7/22',
          attachments: 2,
          members: [member('Anna', 'A', '#14b8a6'), member('Ben', 'B', '#3b82f6')],
        },
        {
          id: 'rw2',
          tag: 'issue',
          title: 'Plan and execute training sessions for new hires',
          image: '/images/bug.svg',
          date: '9 Aug',
          checklist: '5/19',
          attachments: 5,
          members: [member('Mia', 'M', '#ec4899'), member('Chris', 'C', '#8b5cf6')],
        },
      ],
    },
  ],
};

/**
 * Deep clone through JSON. The board is plain JSON data, and this also unwraps
 * Vue's reactive proxies (which `structuredClone` rejects).
 */
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isBoardState(value: unknown): value is KanbanBoardState {
  const state = value as KanbanBoardState | null;
  return !!state && Array.isArray(state.columns) && state.columns.length > 0;
}

/**
 * The seed is the initial state. Stored data is merged in asynchronously by
 * `hydrateBoard()` once Ionic Storage has been created.
 */
export const board = reactive<KanbanBoardState>(clone(seed));

let persistChain: Promise<void> = Promise.resolve();
let storageReady: Promise<void> | null = null;

/**
 * Create the Ionic Storage database once, and reuse that same promise.
 * Calling `set()` before `create()` resolves throws, so every read/write
 * goes through here (this also keeps things working after a Vite HMR reload).
 */
function ensureStorage(): Promise<void> {
  if (!storageReady) {
    storageReady = storage.create().then(() => undefined);
    storageReady.catch(() => {
      storageReady = null; // allow a retry on the next call
    });
  }
  return storageReady;
}

function applyState(state: KanbanBoardState): void {
  board.name = state.name;
  board.members = state.members;
  board.columns = state.columns;
}

/**
 * Load the persisted board into `board`.
 * Call once at startup, before the router renders.
 */
export async function hydrateBoard(): Promise<void> {
  try {
    await ensureStorage();
    const stored = await storage.get(BOARD_STORAGE_KEY);
    if (isBoardState(stored)) {
      applyState(stored);
      return;
    }
  } catch (error) {
    console.warn('[kanban] could not read saved board, using the seed', error);
    return;
  }

  // One-time migration from the earlier raw-localStorage implementation.
  try {
    const legacy = typeof localStorage !== 'undefined' ? localStorage.getItem(LEGACY_STORAGE_KEY) : null;
    if (legacy) {
      const parsed = JSON.parse(legacy) as KanbanBoardState;
      if (isBoardState(parsed)) {
        applyState(parsed);
        await persistBoard();
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    }
  } catch {
    /* ignore a corrupted legacy value */
  }
}

/**
 * Write the current board to Ionic Storage.
 * Writes are serialised so concurrent saves cannot interleave.
 */
export function persistBoard(): Promise<void> {
  persistChain = persistChain
    .then(() => ensureStorage())
    .then(() => storage.set(BOARD_STORAGE_KEY, clone(toRawBoard())))
    .catch((error) => {
      console.warn('[kanban] could not save the board', error);
    });
  return persistChain;
}

function toRawBoard(): KanbanBoardState {
  return clone({
    name: board.name,
    members: board.members,
    columns: board.columns,
  });
}

/** Plain snapshot of the current board, suitable for JSON export. */
export function getBoardSnapshot(): KanbanBoardState {
  return toRawBoard();
}

/**
 * Replace the current board with imported data.
 * Returns false when the payload is not a valid board state.
 */
export async function importBoardState(value: unknown): Promise<boolean> {
  if (!isBoardState(value)) return false;
  applyState(clone(value as KanbanBoardState));
  await persistBoard();
  return true;
}

export function resetBoard(): Promise<void> {
  const fresh = clone(seed);
  applyState(fresh);
  return persistBoard();
}

/* ------------------------------------------------------------------ */
/* UI state: collapsed columns (persisted separately from board data)  */
/* ------------------------------------------------------------------ */

export const collapsedColumns = ref<Set<string>>(new Set());

/** Load the persisted collapsed-column ids. Call together with `hydrateBoard()`. */
export async function hydrateUiState(): Promise<void> {
  try {
    await ensureStorage();
    const stored = await storage.get(UI_STORAGE_KEY);
    if (Array.isArray(stored)) collapsedColumns.value = new Set(stored.filter((id) => typeof id === 'string'));
  } catch (error) {
    console.warn('[kanban] could not read UI state', error);
  }
}

export function toggleColumnCollapsed(columnId: string): void {
  const next = new Set(collapsedColumns.value);
  if (next.has(columnId)) next.delete(columnId);
  else next.add(columnId);
  collapsedColumns.value = next;

  persistChain = persistChain
    .then(() => ensureStorage())
    .then(() => storage.set(UI_STORAGE_KEY, [...next]))
    .catch((error) => {
      console.warn('[kanban] could not save UI state', error);
    });
}

export function findCard(cardId: string): { card: KanbanCard; column: KanbanColumn } | null {
  for (const column of board.columns) {
    const card = column.cards.find((item) => item.id === cardId);
    if (card) return { card, column };
  }
  return null;
}

/** Every member known to the board: header members plus anyone assigned to a card. */
export function memberDirectory(): KanbanMember[] {
  const byName = new Map<string, KanbanMember>();
  for (const item of board.members) byName.set(item.name, item);
  for (const column of board.columns) {
    for (const card of column.cards) {
      for (const item of card.members) byName.set(item.name, item);
    }
  }
  return [...byName.values()];
}

export function createCard(): KanbanCard {
  return {
    id: `card-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    title: '',
    tag: 'undefined',
    members: [],
    priority: 'medium',
    completed: false,
    checklistItems: [],
    attachmentFiles: [],
  };
}

/** Insert or update a card, moving it between columns when the column changed. */
export function upsertCard(card: KanbanCard, columnId: string, originalColumnId?: string): void {
  const target = board.columns.find((column) => column.id === columnId) ?? board.columns[0];
  if (!target) return;

  const source = originalColumnId
    ? board.columns.find((column) => column.id === originalColumnId)
    : board.columns.find((column) => column.cards.some((item) => item.id === card.id));

  const existing = source?.cards.find((item) => item.id === card.id);

  if (!existing) {
    target.cards.push(card);
  } else if (source && source.id !== target.id) {
    Object.assign(existing, card);
    source.cards = source.cards.filter((item) => item.id !== card.id);
    target.cards.push(existing);
  } else {
    Object.assign(existing, card);
  }

  persistBoard();
}

export function removeCard(cardId: string): void {
  for (const column of board.columns) {
    const next = column.cards.filter((item) => item.id !== cardId);
    if (next.length !== column.cards.length) {
      column.cards = next;
      persistBoard();
      return;
    }
  }
}

/**
 * Move a card into another column (or reorder it within the same column).
 * Returns false when nothing changed.
 */
export function moveCard(cardId: string, toColumnId: string, index?: number): boolean {
  const target = board.columns.find((column) => column.id === toColumnId);
  if (!target) return false;

  const source = board.columns.find((column) => column.cards.some((item) => item.id === cardId));
  if (!source) return false;

  const fromIndex = source.cards.findIndex((item) => item.id === cardId);
  const card = source.cards[fromIndex];
  if (!card) return false;

  if (source.id === target.id) {
    let desired = index === undefined ? fromIndex : index;

    // `index` is an insertion slot in the pre-move list (which still includes the
    // dragged card). Removing the card shifts later slots down by one.
    if (desired > fromIndex) desired -= 1;
    desired = Math.min(Math.max(desired, 0), source.cards.length - 1);

    if (desired === fromIndex) return false;

    source.cards.splice(fromIndex, 1);
    source.cards.splice(desired, 0, card);
  } else {
    source.cards.splice(fromIndex, 1);
    const at = index === undefined ? target.cards.length : Math.min(Math.max(index, 0), target.cards.length);
    target.cards.splice(at, 0, card);
  }

  persistBoard();
  return true;
}

/** Remove a column (and all of its cards) from the board. */
export function removeColumn(columnId: string): boolean {
  const index = board.columns.findIndex((column) => column.id === columnId);
  if (index < 0) return false;
  board.columns.splice(index, 1);
  collapsedColumns.value.delete(columnId);
  persistBoard();
  return true;
}

/** Add a new empty column to the board. */
export function addColumn(title: string): KanbanColumn | null {
  const name = title.trim();
  if (!name) return null;

  const column: KanbanColumn = {
    id: `col-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    title: name,
    cards: [],
  };

  board.columns.push(column);
  persistBoard();
  return column;
}
