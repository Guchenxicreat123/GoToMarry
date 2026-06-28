import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as guestApi from '@/api/guests';

export const useGuestStore = defineStore('guest', () => {
  const items = ref([]);
  const summary = ref(null);

  const totalAttendCount = computed(() => summary.value?.totalAttendCount || 0);
  const confirmedCount = computed(() => summary.value?.confirmed || 0);

  async function fetchList(filters = {}) {
    items.value = await guestApi.getList(filters);
  }

  async function fetchSummary() {
    summary.value = await guestApi.getSummary();
  }

  async function addGuest(data) {
    const newItem = await guestApi.create(data);
    items.value.push(newItem);
    await fetchSummary();
    return newItem;
  }

  async function updateGuest(id, data) {
    const updated = await guestApi.update(id, data);
    const idx = items.value.findIndex(i => i.id === id);
    if (idx !== -1) items.value[idx] = updated;
    await fetchSummary();
    return updated;
  }

  async function deleteGuest(id) {
    await guestApi.remove(id);
    items.value = items.value.filter(i => i.id !== id);
    await fetchSummary();
  }

  async function batchImport(items) {
    const result = await guestApi.batchCreate({ items });
    await fetchList();
    await fetchSummary();
    return result;
  }

  async function fetchAll() {
    await Promise.all([fetchList(), fetchSummary()]);
  }

  return {
    items,
    summary,
    totalAttendCount,
    confirmedCount,
    fetchList,
    fetchSummary,
    addGuest,
    updateGuest,
    deleteGuest,
    batchImport,
    fetchAll
  };
});
