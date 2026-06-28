<template>
  <div class="budget-edit-page">
    <van-nav-bar
      :title="isEdit ? '编辑预算' : '新增预算'"
    >
      <template #right v-if="isEdit">
        <van-icon name="delete-o" size="20" color="#ee0a24" @click="handleDelete" />
      </template>
    </van-nav-bar>

    <div class="form-body">
      <van-form @submit="handleSubmit">
        <van-cell-group inset>
          <!-- 项目名称 -->
          <van-field
            v-model="form.itemName"
            label="项目名称"
            placeholder="如：场地定金、婚纱租赁"
            :rules="[{ required: true, message: '请填写项目名称' }]"
            clearable
          />

          <!-- 一级分类 -->
          <van-field
            v-model="form.category"
            name="category"
            label="一级分类"
            is-link
            readonly
            placeholder="请选择分类"
            :rules="[{ required: true, message: '请选择分类' }]"
            @click="showCategory = true"
          />

          <!-- 二级分类 -->
          <van-field
            v-model="form.subCategory"
            label="二级分类"
            is-link
            readonly
            placeholder="选填"
            @click="showSubCategory = true"
            :disabled="!form.category"
          />

          <!-- 供应商 -->
          <van-field
            v-model="form.vendor"
            label="供应商"
            placeholder="选填"
            clearable
          />

          <!-- 预估金额 -->
          <van-field
            v-model="form.estimatedAmount"
            label="预估金额"
            type="digit"
            placeholder="0"
            clearable
          >
            <template #extra>
              <span class="unit">元</span>
            </template>
          </van-field>

          <!-- 实际金额 -->
          <van-field
            v-model="form.actualAmount"
            label="实际金额"
            type="digit"
            placeholder="0"
            clearable
          >
            <template #extra>
              <span class="unit">元</span>
            </template>
          </van-field>

          <!-- 支付日期 -->
          <van-field
            v-model="form.paidDate"
            label="支付日期"
            type="date"
            placeholder="选填"
          />

          <!-- 是否结清 -->
          <van-cell center title="已结清？">
            <template #right-icon>
              <van-switch v-model="form.isPaid" size="22" />
            </template>
          </van-cell>

          <!-- 备注 -->
          <van-field
            v-model="form.remark"
            label="备注"
            type="textarea"
            rows="3"
            placeholder="选填"
            maxlength="200"
            show-word-limit
          />
        </van-cell-group>

        <!-- 操作按钮组（编辑模式下两个平铺） -->
        <div class="form-actions" v-if="isEdit">
          <div class="form-btn-wrap">
            <van-button round block size="large" type="primary" plain @click="$router.back()">
              返回
            </van-button>
          </div>
          <div class="form-btn-wrap">
            <van-button round block native-type="submit" size="large" type="primary" class="save-btn">
              保存
            </van-button>
          </div>
        </div>
        <div class="form-submit" v-else>
          <van-button round block type="primary" native-type="submit" size="large">
            添加记录
          </van-button>
        </div>
      </van-form>
    </div>

    <!-- 分类选择器 -->
    <van-popup v-model:show="showCategory" position="bottom" round>
      <van-picker
        :columns="categoryColumns"
        @confirm="onCategoryConfirm"
        @cancel="showCategory = false"
        title="选择一级分类"
      />
    </van-popup>

    <!-- 二级分类选择器 -->
    <van-popup v-model:show="showSubCategory" position="bottom" round>
      <van-picker
        :columns="subCategoryColumns"
        @confirm="onSubCategoryConfirm"
        @cancel="showSubCategory = false"
        title="选择二级分类"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { showToast, showDialog, showConfirmDialog } from 'vant';
import { useBudgetStore } from '@/stores/budget';

const router = useRouter();
const route = useRoute();
const budgetStore = useBudgetStore();

// 判断是新增还是编辑
const isEdit = computed(() => !!route.params.id);
const editingId = computed(() => route.params.id);

const showCategory = ref(false);
const showSubCategory = ref(false);

const form = reactive({
  itemName: '',
  category: '',
  subCategory: '',
  vendor: '',
  estimatedAmount: '',
  actualAmount: '',
  paidDate: '',
  isPaid: false,
  remark: ''
});

// 如果是编辑模式，加载已有数据
watch(
  () => budgetStore.items,
  (items) => {
    if (isEdit.value && items.length > 0) {
      const item = items.find(i => String(i.id) === String(editingId.value));
      if (item) {
        Object.assign(form, {
          itemName: item.item_name || '',
          category: item.category || '',
          subCategory: item.sub_category || '',
          vendor: item.vendor || '',
          estimatedAmount: item.estimated_amount || '',
          actualAmount: item.actual_amount || '',
          paidDate: item.paid_date || '',
          isPaid: !!item.is_paid,
          remark: item.remark || ''
        });
      }
    }
  },
  { immediate: true }
);

// 分类数据
const categoryColumns = computed(() =>
  (budgetStore.categories?.categories || []).map(c => ({ text: c, value: c }))
);

const subCategoryColumns = computed(() => {
  if (!form.category || !budgetStore.categories?.subCategories?.[form.category]) return [];
  return budgetStore.categories.subCategories[form.category].map(c => ({ text: c, value: c }));
});

function onCategoryConfirm(params) {
  form.category = params.selectedValues[0];
  form.subCategory = '';
  showCategory.value = false;
}

function onSubCategoryConfirm(params) {
  form.subCategory = params.selectedValues[0];
  showSubCategory.value = false;
}

async function handleSubmit() {
  try {
    const data = {
      itemName: form.itemName,
      category: form.category,
      subCategory: form.subCategory || '',
      vendor: form.vendor || '',
      estimatedAmount: form.estimatedAmount ? Number(form.estimatedAmount) : 0,
      actualAmount: form.actualAmount ? Number(form.actualAmount) : 0,
      paidDate: form.paidDate || '',
      isPaid: form.isPaid,
      remark: form.remark || ''
    };

    if (isEdit.value) {
      await budgetStore.updateBudget(editingId.value, data);
      showToast('✅ 已保存');
    } else {
      await budgetStore.addBudget(data);
      showToast('✅ 已添加');
    }
    router.back();
  } catch (err) {
    showToast(err.message || '保存失败，请重试');
  }
}

async function handleDelete() {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: `确定要删除「${form.itemName}」吗？`,
      confirmButtonColor: 'var(--danger)'
    });
    await budgetStore.deleteBudget(editingId.value);
    showToast('🗑️ 已删除');
    router.back();
  } catch {
    // 用户取消删除，不处理
  }
}

onMounted(() => {
  budgetStore.fetchAll();
});
</script>

<style scoped>
.budget-edit-page {
  min-height: 100vh;
  background: var(--bg-page);
}

.form-body {
  padding: var(--space-lg);
}

:deep(.van-cell-group--inset) {
  margin: 0;
  border-radius: var(--radius-lg) !important;
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.unit {
  font-size: 14px;
  color: var(--text-tertiary);
  padding-right: 4px;
}

.form-submit {
  margin-top: 24px;
  margin-bottom: 40px;
}

.form-submit :deep(.van-button) {
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, var(--primary), var(--accent)) !important;
  border: none !important;
  box-shadow: 0 4px 12px rgba(232,141,122,0.3);
}

/* 编辑模式下的双按钮布局 */
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  margin-bottom: 40px;
}

.form-btn-wrap {
  flex: 1;
}

/* 粉色保存按钮 */
.save-btn {
  --van-button-primary-background: var(--primary) !important;
  --van-button-primary-border-color: var(--primary) !important;
  box-shadow: 0 4px 12px rgba(242,107,138,0.3) !important;
}
</style>
