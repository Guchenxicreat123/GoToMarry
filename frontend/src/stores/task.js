import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as taskApi from '@/api/tasks';

export const useTaskStore = defineStore('task', () => {
  const items = ref([]);

  async function fetchList(filters = {}) {
    items.value = await taskApi.getList(filters);
  }

  async function addTask(data) {
    const newItem = await taskApi.create(data);
    items.value.push(newItem);
    return newItem;
  }

  async function updateTask(id, data) {
    const updated = await taskApi.update(id, data);
    const idx = items.value.findIndex(i => i.id === id);
    if (idx !== -1) items.value[idx] = updated;
    return updated;
  }

  async function deleteTask(id) {
    await taskApi.remove(id);
    items.value = items.value.filter(i => i.id !== id);
  }

  async function toggleTask(id) {
    const updated = await taskApi.toggle(id);
    const idx = items.value.findIndex(i => i.id === id);
    if (idx !== -1) items.value[idx] = updated;
    return updated;
  }

  return {
    items,
    fetchList,
    addTask,
    updateTask,
    deleteTask,
    toggleTask
  };
});
