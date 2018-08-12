const routers = [
  {
    path: '/',
    redirect: '/index'
  },
  {
    path: '/index',
    name: 'index',
    component: res => require(['./components/main/index-main.vue'], res)
  },
  {
    path: '/info-manage',
    name: 'info-manage',
    component: res => require(['./components/main/info-manage-main.vue'], res)
  },
  {
    path: '/moments',
    name: 'moments',
    component: res => require(['./components/main/moments-main.vue'], res)
  },
  {
    path: '/articles',
    name: 'articles',
    component: res => require(['./components/main/articles-main.vue'], res)
  },
  {
    path: '/articles/details',
    name: 'articles-details',
    component: res => require(['./components/main/articles-details-main.vue'], res)
  },
  {
    path: '/articles/compose',
    name: 'articles-compose',
    component: res => require(['./components/main/articles-compose.vue'], res)
  },
  {
    path: '/resources',
    name: 'resources',
    component: res => require(['./components/main/resources-main.vue'], res)
  }
];

export default routers;
