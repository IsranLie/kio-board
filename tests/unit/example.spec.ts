import { mount } from '@vue/test-utils';
import { describe, expect, test } from 'vitest';

import KanbanPage from '@/views/KanbanPage.vue';

describe('KanbanPage.vue', () => {
  test('renders kanban board', () => {
    const wrapper = mount(KanbanPage);
    expect(wrapper.text()).toContain('Adhivasindo');
    expect(wrapper.text()).toContain('To do');
  });
});
