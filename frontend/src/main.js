import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { router } from './router';
import App from './App.vue';
import './styles/variables.css';

// 导入 Vant 组件库（全部注册）
import Vant from 'vant';
import 'vant/lib/index.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(Vant); // 注册所有 Vant 组件

app.mount('#app');
