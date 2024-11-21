import { init } from './bootstrap';

const app = init(process.env);

document.addEventListener('DOMContentLoaded', async() => {
  const {
    Vue,
    Root,
    router,
    vuetify,
    store
  } = await app;

  new Vue({
    router,
    render(createElement) {
      return createElement(Root);
    },
    vuetify,
    store
  }).$mount('#app');

  if(process.env.VUE_APP_DOCHUB_MODE === 'backend') {
    try {
      const response = await fetch('/api/title');
      const data = await response.json();

      const headerTitle = document.querySelector('.v-toolbar__title');

      if(headerTitle) {
        headerTitle.textContent = data.title;
      } else console.warn('Header title not found');
    } catch(e) {
      console.error('Error fetching title', e);
    }
  }

  window.$PAPI?.loaded && window.$PAPI.loaded();
});
