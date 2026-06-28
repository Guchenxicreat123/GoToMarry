<template>
  <div class="guest-batch-page">
    <van-nav-bar title="批量导入" left-text="取消" left-arrow @click-left="$router.back()" />
    
    <div class="content">
      <div class="intro">
        <p>支持批量导入宾客，每个宾客一行，格式：</p>
        <code>姓名, 归属, 关系, 电话, 出席人数</code>
        <p class="example">例如：张三, 女方, 亲戚, 13800138000, 2</p>
      </div>
      
      <van-field
        v-model="inputText"
        type="textarea"
        rows="10"
        placeholder="请粘贴宾客数据"
        class="input-area"
      />
      
      <div class="action-bar">
        <van-button round block type="primary" @click="handleImport">
          导入
        </van-button>
        <van-button round block @click="downloadTemplate" style="margin-top: 10px;">
          下载模板
        </van-button>
      </div>
      
      <!-- 预览 -->
      <van-dialog
        v-model:show="showPreview"
        title="预览数据"
        :show-confirm-button="false"
      >
        <van-table>
          <thead>
            <tr>
              <th v-for="col in previewColumns" :key="col">{{ col }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in previewData" :key="idx">
              <td>{{ item.name }}</td>
              <td>{{ item.side === 'groom' ? '男方' : '女方' }}</td>
              <td>{{ item.relation }}</td>
              <td>{{ item.phone }}</td>
              <td>{{ item.attendCount }}</td>
            </tr>
          </tbody>
        </van-table>
        <div class="dialog-footer">
          <van-button type="primary" block @click="confirmImport">确认导入 ({{ previewData.length }}人)</van-button>
        </div>
      </van-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { showToast, showDialog } from 'vant';
import { useGuestStore } from '@/stores/guest';

const router = useRouter();
const guestStore = useGuestStore();

const inputText = ref('');
const showPreview = ref(false);
const previewData = ref([]);

const previewColumns = ['姓名', '归属', '关系', '电话', '人数'];

function parseInput() {
  const lines = inputText.value.split('\n').filter(l => l.trim());
  const items = [];
  
  for (const line of lines) {
    const parts = line.split(/[,\s,]/).filter(p => p.trim());
    if (parts.length >= 2) {
      items.push({
        name: parts[0].trim(),
        side: parts[1].trim() === '男方' ? 'groom' : (parts[1].trim() === '女方' ? 'bride' : parts[1].trim()),
        relation: parts[2]?.trim() || '',
        phone: parts[3]?.trim() || '',
        attendCount: parts[4] ? Number(parts[4]) : 1
      });
    }
  }
  
  return items;
}

function handleImport() {
  if (!inputText.value.trim()) {
    showToast('请输入数据');
    return;
  }
  
  const items = parseInput();
  if (items.length === 0) {
    showToast('格式不正确，请检查');
    return;
  }
  
  previewData.value = items;
  showPreview.value = true;
}

async function confirmImport() {
  try {
    await guestStore.batchImport(previewData.value);
    showToast(`成功导入 ${previewData.value.length} 位宾客`);
    router.push('/guests');
  } catch (err) {
    showToast(err.message || '导入失败');
  }
}

function downloadTemplate() {
  const template = `姓名,归属,关系,电话,出席人数
张三,女方,亲戚,13800138000,2
李四,男方,同事,13900139000,1
王五,女方,同学,,1`;
  
  const blob = new Blob([template], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'guests_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<style scoped>
.guest-batch-page {
  min-height: 100vh;
}

.content {
  padding: 16px;
}

.intro {
  font-size: 14px;
  color: #969799;
  margin-bottom: 16px;
}

.intro code {
  display: block;
  background: #f5f5f5;
  padding: 8px 12px;
  border-radius: 4px;
  font-family: Consolas, monospace;
  margin: 8px 0;
}

.example {
  color: #e88d7a;
  font-style: italic;
}

.input-area :deep(textarea) {
  font-family: Consolas, monospace;
  font-size: 14px;
}

.action-bar {
  margin-top: 16px;
}

.dialog-footer {
  margin-top: 16px;
}
</style>
