<template>
  <div v-if="displayMembers.length" class="members">
    <span
      v-for="member in displayMembers"
      :key="member.name"
      class="avatar"
      :class="{ 'avatar-removable': removable }"
      :style="{ backgroundColor: member.color }"
      :title="member.name"
    >
      {{ member.initials }}
      <button
        v-if="removable"
        type="button"
        class="avatar-remove"
        :aria-label="`Remove ${member.name}`"
        @click.stop="emit('remove', member)"
      >
        <ion-icon :icon="closeOutline" aria-hidden="true" />
      </button>
    </span>
    <span v-if="extraCount" class="avatar avatar-more" :title="`+${extraCount} lainnya`"> +{{ extraCount }} </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IonIcon } from '@ionic/vue';
import { closeOutline } from 'ionicons/icons';
import type { KanbanMember } from '@/types/kanban';

const props = withDefaults(
  defineProps<{
    members: KanbanMember[];
    /** Show a delete button on each avatar. */
    removable?: boolean;
    /** How many avatars to show before collapsing into "+N". */
    maxVisible?: number;
  }>(),
  {
    removable: false,
    maxVisible: 4,
  },
);

const emit = defineEmits<{
  (e: 'remove', member: KanbanMember): void;
}>();

// In removable mode every member must be reachable, so nothing is collapsed.
const displayMembers = computed(() => (props.removable ? props.members : props.members.slice(0, props.maxVisible)));
const extraCount = computed(() => (props.removable ? 0 : Math.max(0, props.members.length - props.maxVisible)));
</script>

<style scoped>
.members {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.avatar {
  position: relative;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  border: 2px solid #fff;
  margin-left: -6px;
}

.avatar:first-child {
  margin-left: 0;
}

.avatar-more {
  background: #3177f0;
  color: #fff;
  font-size: 9px;
}

.avatar-remove {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 15px;
  height: 15px;
  padding: 0;
  border: 1.5px solid #fff;
  border-radius: 50%;
  background: #ef4444;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transform: scale(0.8);
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.avatar-remove ion-icon {
  font-size: 9px;
  pointer-events: none;
}

.avatar-removable:hover .avatar-remove,
.avatar-remove:focus-visible {
  opacity: 1;
  transform: scale(1);
}

.avatar-remove:hover {
  background: #dc2626;
}
</style>
