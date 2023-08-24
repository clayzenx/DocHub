import { Store } from 'vuex';
import YAML from 'yaml';
import { listeners } from './pipe';
import config from '@front/config';
import { Buffer } from 'buffer';

enum Files {
  'jpg',
  'jpeg',
  'png',
  'svg',
  'yaml',
  'json',
  'plantuml'
}

type TFiles = keyof typeof Files;

type TEvent = {
  data?: {
    command?: string,
    content?: {
      uri?: string,
      stringifedUri?: string,
      type?: TFiles,
      uuid?: string
      value?: string
    },
    error?: any
  }
}

const getContentType = (type: TFiles): string => {
  if (type === 'svg') {
    return 'image/svg+xml';
  }

  if (['jpg', 'jpeg', 'png'].includes(type)) {
    return `image/${type}`;
  }

  return '';
};

const normalizeResponse = (type: TFiles, content: string): any => {
  if (['jpg', 'jpeg', 'png', 'svg'].includes(type)) {
    return Buffer.from(content, 'base64');
  }

  if (type === 'yaml') {
    return YAML.parse(content);
  }

  if (type === 'json') {
    return JSON.parse(content);
  }

  if (type === 'plantuml') {
    return content;
  }

  return content;
};

export default (store: Store<any>): void => {
  window.addEventListener('message', (event: TEvent) => {
    const {command, content, error} = event?.data;

    if (command === 'response') {
      const {value, type, uuid} = content;

      if (error) {
        listeners[uuid].rej(error);
      }

      try {
        const data = normalizeResponse(type, value);

        listeners[uuid].res({
          data,
          headers: {
            'content-type': getContentType(type)
          }
        });
      } catch (e) {
        listeners[uuid].rej(e);
      } finally {
        delete listeners[uuid];
      }
    }

    if (command === 'has-root-manifest') {
      const {uri} = content;

      if (uri === null) {
        window.DochubVsCodeExt.rootManifest = null;
        // config.root_manifest = null;
        store.commit('setNoInited', true);
      } else {
        window.DochubVsCodeExt.rootManifest = uri;
        // config.root_manifest = uri;
        store.dispatch('reloadAll');
      }
    }
  });
};
