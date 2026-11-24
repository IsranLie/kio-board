export type TagType = 'feature' | 'bug' | 'issue' | 'undefined';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface KanbanMember {
  name: string;
  color: string;
  initials: string;
}

export interface KanbanChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface KanbanAttachment {
  id: string;
  name: string;
  size?: string;
}

export interface KanbanCard {
  id: string;
  title: string;
  tag: TagType;
  tagLabel?: string;
  image?: string;
  date?: string;
  /** ISO date (yyyy-mm-dd) backing the display `date`. */
  dueDate?: string;
  attachments?: number;
  checklist?: string;
  members: KanbanMember[];
  description?: string;
  priority?: Priority;
  completed?: boolean;
  checklistItems?: KanbanChecklistItem[];
  attachmentFiles?: KanbanAttachment[];
}

export interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
}
