import router from '@/router';
import {
  getDefaultStoreActions,
  getDefaultStoreGetters,
  getDefaultStoreMutations,
  getDefaultStoreState
} from '@/utils/store';
import useRequest from '@/services/request';

const endpoint = '/spiders';

const {
  get,
  post,
  del,
} = useRequest();

const state = {
  ...getDefaultStoreState<Spider>('spider'),
  tabs: [
    {id: 'overview', title: 'Overview'},
    {id: 'files', title: 'Files'},
    {id: 'tasks', title: 'Tasks'},
    {id: 'settings', title: 'Settings'},
  ],
  fileNavItems: [],
  fileContent: '',
} as SpiderStoreState;

const getters = {
  ...getDefaultStoreGetters<Spider>(),
  // tab name for spider detail
  tabName: () => {
    const arr = router.currentRoute.value.path.split('/');
    if (arr.length < 3) return null;
    return arr[3];
  },
} as SpiderStoreGetters;

const mutations = {
  ...getDefaultStoreMutations<Spider>(),
  setFileNavItems: (state: SpiderStoreState, navItems: FileNavItem[]) => {
    state.fileNavItems = navItems;
  },
  setFileContent: (state: SpiderStoreState, content: string) => {
    state.fileContent = content;
  },
} as SpiderStoreMutations;

const actions = {
  ...getDefaultStoreActions<Spider>(endpoint),
  listDir: async ({commit}: StoreActionContext<BaseStoreState<Spider>>, {id, path}: FileRequestPayload) => {
    const res = await get(`${endpoint}/${id}/files/list`, {path});
    const navItems = res.data as FileNavItem[];
    commit('setFileNavItems', navItems);
    return res;
  },
  getFile: async ({commit}: StoreActionContext<BaseStoreState<Spider>>, {id, path}: FileRequestPayload) => {
    const res = await get(`${endpoint}/${id}/files/get`, {path});
    commit('setFileContent', res.data);
    return res;
  },
  getFileInfo: async ({commit}: StoreActionContext<BaseStoreState<Spider>>, {id, path}: FileRequestPayload) => {
    return await get(`${endpoint}/${id}/files/info`, {path});
  },
  saveFile: async ({commit}: StoreActionContext<BaseStoreState<Spider>>, {id, path, data}: FileRequestPayload) => {
    const res = await post(`${endpoint}/${id}/files/save`, {path, data});
    commit('setFileContent', res.data);
    return res;
  },
  renameFile: async ({commit}: StoreActionContext<BaseStoreState<Spider>>, {
    id,
    path,
    new_path
  }: FileRequestPayload) => {
    const res = await post(`${endpoint}/${id}/files/rename`, {path, new_path});
    commit('setFileContent', res.data);
    return res;
  },
  deleteFile: async ({commit}: StoreActionContext<BaseStoreState<Spider>>, {id, path}: FileRequestPayload) => {
    const res = await del(`${endpoint}/${id}/files`, {path});
    commit('setFileContent', res.data);
    return res;
  },
  copyFile: async ({commit}: StoreActionContext<BaseStoreState<Spider>>, {
    id,
    path,
    new_path,
    data
  }: FileRequestPayload) => {
    const res = await post(`${endpoint}/${id}/files/copy`, {path, new_path, data});
    commit('setFileContent', res.data);
    return res;
  },
} as SpiderStoreActions;

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
} as SpiderStoreModule;
