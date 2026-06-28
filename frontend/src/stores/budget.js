import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as budgetApi from '@/api/budgets';

export const useBudgetStore = defineStore('budget', () => {
  const items = ref([]);
  const summary = ref(null);
  const categories = ref(null);

  const totalEstimated = computed(() => summary.value?.totalEstimated || 0);
  const totalActual = computed(() => summary.value?.totalActual || 0);
  const remaining = computed(() => summary.value?.remaining || 0);
  const spentRatio = computed(() => summary.value?.spentRatio || 0);

  async function fetchList(filters = {}) {
    items.value = await budgetApi.getList(filters);
  }

  async function fetchSummary() {
    summary.value = await budgetApi.getSummary();
  }

  async function fetchCategories() {
    categories.value = await budgetApi.getCategories();
  }

  async function addBudget(data) {
    const newItem = await budgetApi.create(data);
    items.value.push(newItem);
    await fetchSummary();
    return newItem;
  }

  async function updateBudget(id, data) {
    const updated = await budgetApi.update(id, data);
    const idx = items.value.findIndex(i => i.id === id);
    if (idx !== -1) items.value[idx] = updated;
    await fetchSummary();
    return updated;
  }

  async function deleteBudget(id) {
    await budgetApi.remove(id);
    items.value = items.value.filter(i => i.id !== id);
    await fetchSummary();
  }

  async function fetchAll() {
    await Promise.all([fetchList(), fetchSummary(), fetchCategories()]);
  }

  return {
    items,
    summary,
    categories,
    totalEstimated,
    totalActual,
    remaining,
    spentRatio,
    fetchList,
    fetchSummary,
    fetchCategories,
    addBudget,
    updateBudget,
    deleteBudget,
    fetchAll
  };
});
