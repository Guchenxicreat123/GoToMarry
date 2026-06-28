<template>
  <div class="guest-create-page">
    <van-nav-bar title="新增宾客" left-text="取消" left-arrow @click-left="$router.back()" />
    
    <div class="content">
      <van-form @submit="handleSubmit">
        <van-field
          v-model="form.name"
          name="name"
          label="姓名"
          placeholder="请输入姓名"
          :rules="[{ required: true, message: '请输入姓名' }]"
        />
        
        <van-field
          :model-value="sideLabel"
          name="side"
          label="归属"
          is-link
          readonly
          placeholder="请选择归属"
          :rules="[{ required: true, message: '请选择归属' }]"
          @click="showSidePicker = true"
        />
        
        <van-field
          v-model="form.relation"
          name="relation"
          label="关系"
          is-link
          readonly
          placeholder="请选择关系（可选）"
          @click="showRelationPicker = true"
        />
        
        <van-field
          v-model="form.phone"
          name="phone"
          label="电话"
          type="tel"
          placeholder="请输入联系电话"
        />
        
        <van-field name="attendCount" label="出席人数">
          <template #input>
            <van-stepper v-model="form.attendCount" min="1" max="5" button-size="24" />
          </template>
        </van-field>
        
        <van-field name="isInvited" label="已发请柬">
          <template #input>
            <van-switch v-model="form.isInvited" />
          </template>
        </van-field>
        
        <van-field name="isConfirmed" label="已确认出席">
          <template #input>
            <van-switch v-model="form.isConfirmed" />
          </template>
        </van-field>
        
        <van-field
          v-model="form.remark"
          name="remark"
          label="备注"
          type="textarea"
          rows="3"
          placeholder="请输入备注"
        />
        
        <div class="form-footer">
          <van-button round block type="primary" native-type="submit">
            保存
          </van-button>
        </div>
      </van-form>
    </div>
    
    <!-- 归属选择器 -->
    <van-popup v-model:show="showSidePicker" position="bottom">
      <van-picker
        :columns="sideColumns"
        @confirm="onSideConfirm"
        @cancel="showSidePicker = false"
      />
    </van-popup>
    
    <!-- 关系选择器 -->
    <van-popup v-model:show="showRelationPicker" position="bottom">
      <van-picker
        :columns="relationColumns"
        @confirm="onRelationConfirm"
        @cancel="showRelationPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import { useGuestStore } from '@/stores/guest';

const router = useRouter();
const guestStore = useGuestStore();

const showSidePicker = ref(false);
const showRelationPicker = ref(false);

const form = reactive({
  name: '',
  side: '',
  relation: '',
  phone: '',
  attendCount: 1,
  isInvited: false,
  isConfirmed: false,
  remark: ''
});

const sideColumns = [
  { text: '男方', value: 'groom' },
  { text: '女方', value: 'bride' },
];

const relationColumns = [
  { text: '亲戚', value: '亲戚' },
  { text: '同学', value: '同学' },
  { text: '同事', value: '同事' },
  { text: '朋友', value: '朋友' },
  { text: '其他', value: '其他' },
];

function onSideConfirm(params) {
  form.side = params.selectedValues[0];
  showSidePicker.value = false;
}

const sideLabel = computed(() => {
  const map = { groom: '男方', bride: '女方' };
  return map[form.side] || '';
});

function onRelationConfirm(params) {
  form.relation = params.selectedValues[0];
  showRelationPicker.value = false;
}

async function handleSubmit() {
  try {
    const data = {
      ...form,
      attendCount: form.attendCount,
    };
    
    await guestStore.addGuest(data);
    showToast('宾客添加成功');
    router.push('/guests');
  } catch (err) {
    showToast(err.message || '添加失败');
  }
}
</script>

<style scoped>
.guest-create-page {
  min-height: 100vh;
}

.content {
  padding: 16px;
}

.form-footer {
  margin-top: 20px;
}
</style>
