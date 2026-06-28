import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as diaryApi from '@/api/diaries';

export const useDiaryStore = defineStore('diary', () => {
  const items = ref([]);

  async function fetchAll() {
    items.value = await diaryApi.getList();
  }

  async function addDiary(data) {
    const newItem = await diaryApi.create(data);
    items.value.unshift(newItem);
    return newItem;
  }

  async function updateDiary(id, data) {
    const updated = await diaryApi.update(id, data);
    const idx = items.value.findIndex(i => i.id === id);
    if (idx !== -1) items.value[idx] = updated;
    return updated;
  }

  async function deleteDiary(id) {
    await diaryApi.remove(id);
    items.value = items.value.filter(i => i.id !== id);
  }

  return { items, fetchAll, addDiary, updateDiary, deleteDiary };
});