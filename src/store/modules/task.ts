import {
  getDefaultStoreActions,
  getDefaultStoreGetters,
  getDefaultStoreMutations,
  getDefaultStoreState
} from '@/utils/store';

const state = {
  ...getDefaultStoreState<Task>('task'),
} as TaskStoreState;

const getters = {
  ...getDefaultStoreGetters<Task>(),
} as TaskStoreGetters;

const mutations = {
  ...getDefaultStoreMutations<Task>(),
} as TaskStoreMutations;

const actions = {
  ...getDefaultStoreActions<Task>('/tasks'),
} as TaskStoreActions;

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
} as TaskStoreModule;
