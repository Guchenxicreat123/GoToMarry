import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as giftApi from '@/api/gifts';

export const useGiftStore = defineStore('gift', () => {
  const items = ref([]);
  const summary = ref(null);

  async function fetchAll() {
    const [list, sum] = await Promise.all([giftApi.getList(), giftApi.getSummary()]);
    items.value = list;
    summary.value = sum;
  }

  async function addGift(data) {
    const newItem = await giftApi.create(data);
    items.value.unshift(newItem);
    summary.value = await giftApi.getSummary();
    return newItem;
  }

  async function updateGift(id, data) {
    const updated = await giftApi.update(id, data);
    const idx = items.value.findIndex(i => i.id === id);
    if (idx !== -1) items.value[idx] = updated;
    summary.value = await giftApi.getSummary();
    return updated;
  }

  async function deleteGift(id) {
    await giftApi.remove(id);
    items.value = items.value.filter(i => i.id !== id);
    summary.value = await giftApi.getSummary();
  }

  return { items, summary, fetchAll, addGift, updateGift, deleteGift };
});
