import { createRouter, createWebHashHistory } from 'vue-router';

// 懒加载组件
const Login = () => import('@/views/Login.vue');
const Home = () => import('@/views/Home.vue');
const TaskList = () => import('@/views/TaskList.vue');
const BudgetList = () => import('@/views/BudgetList.vue');
const BudgetEdit = () => import('@/views/BudgetEdit.vue');
const GuestList = () => import('@/views/GuestList.vue');
const GuestCreate = () => import('@/views/GuestCreate.vue');
const GuestBatch = () => import('@/views/GuestBatch.vue');
const SeatingPlan = () => import('@/views/SeatingPlan.vue');
const GiftList = () => import('@/views/GiftList.vue');
const DiaryList = () => import('@/views/DiaryList.vue');
const InvitationList = () => import('@/views/InvitationList.vue');
const CalendarPage = () => import('@/views/CalendarPage.vue');
const Album = () => import('@/views/Album.vue');
const Gallery = () => import('@/views/Gallery.vue');
const SpaceAlbum = () => import('@/views/SpaceAlbum.vue');

const routes = [
  { path: '/login', component: Login },
  { path: '/', component: Home, meta: { requiresAuth: true, title: '首页' } },
  { path: '/tasks', component: TaskList, meta: { requiresAuth: true, title: '备婚清单' } },
  { path: '/budgets', component: BudgetList, meta: { requiresAuth: true, title: '婚礼账本' } },
  { path: '/budgets/create', component: BudgetEdit, meta: { requiresAuth: true, title: '新增预算' } },
  { path: '/budgets/:id/edit', component: BudgetEdit, meta: { requiresAuth: true, title: '编辑预算' } },
  { path: '/guests', component: GuestList, meta: { requiresAuth: true, title: '宾客管理' } },
  { path: '/guests/create', component: GuestCreate, meta: { requiresAuth: true, title: '新增宾客' } },
  { path: '/guests/batch', component: GuestBatch, meta: { requiresAuth: true, title: '批量导入' } },
  { path: '/seating', component: SeatingPlan, meta: { requiresAuth: true, title: '排座' } },
  { path: '/gifts', component: GiftList, meta: { requiresAuth: true, title: '礼金记录' } },
  { path: '/diaries', component: DiaryList, meta: { requiresAuth: true, title: '时光小记' } },
  { path: '/invitations', component: InvitationList, meta: { requiresAuth: true, title: '请帖' } },
  { path: '/calendar', component: CalendarPage, meta: { requiresAuth: true, title: '纪念日' } },
  // 相册总入口
  { path: '/album', component: Album, meta: { requiresAuth: true, title: '相册' } },
  // 时光画廊（相册子页面，同时保留独立路径）
  { path: '/gallery', component: Gallery, meta: { requiresAuth: true, title: '时光画廊' }, alias: '/album/gallery' },
  // 星空宇宙（相册子页面，同时保留独立路径）
  { path: '/space', component: SpaceAlbum, meta: { requiresAuth: true, title: '星空宇宙' }, alias: '/album/space' },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  if (to.meta.title) document.title = `${to.meta.title} - GoToMarry`;
  if (to.meta.requiresAuth && !token) next('/login');
  else if (to.path === '/login' && token) next('/');
  else next();
});

export default router;
