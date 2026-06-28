import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as tableApi from '@/api/tables';
import * as guestApi from '@/api/guests';

export const useTableStore = defineStore('table', () => {
  const items = ref([]);

  async function fetchList() {
    items.value = await tableApi.getList();
  }

  async function addTable(data) {
    const newItem = await tableApi.create(data);
    items.value.push(newItem);
    return newItem;
  }

  async function updateTable(id, data) {
    const updated = await tableApi.update(id, data);
    const idx = items.value.findIndex(i => i.id === id);
    if (idx !== -1) items.value[idx] = updated;
    return updated;
  }

  async function deleteTable(id) {
    await tableApi.remove(id);
    items.value = items.value.filter(i => i.id !== id);
  }

  async function assignGuests(tableId, guestIds) {
    if (tableId === null) {
      // 取消分配：通过更新宾客接口清除 table_id
      for (const guestId of guestIds) {
        await guestApi.update(guestId, { tableId: null });
      }
      return;
    }
    await tableApi.assign(tableId, { guestIds });
    await fetchList();
  }

  return {
    items,
    fetchList,
    addTable,
    updateTable,
    deleteTable,
    assignGuests
  };
});
