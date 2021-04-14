import {computed, provide, watch} from 'vue';
import {Store} from 'vuex';
import {cloneArray, plainClone} from '@/utils/object';
import useFormTable from '@/components/form/formTable';

const useForm = (ns: ListStoreNamespace, store: Store<RootStoreState>, services: Services<BaseModel>, data: FormComponentData<BaseModel>) => {
  const {
    form,
    formRef,
    formList,
    formTableFieldRefsMap,
  } = data;

  const getNewForm = () => {
    return {...form.value};
  };

  const getNewFormList = () => {
    const list = [];
    for (let i = 0; i < 5; i++) {
      list.push(getNewForm());
    }
    return list;
  };

  // store state
  const state = store.state[ns];

  // active dialog key
  const activeDialogKey = computed<DialogKey | undefined>(() => state.activeDialogKey);

  // is selective form
  const isSelectiveForm = computed<boolean>(() => state.isSelectiveForm);

  // selected form fields
  const selectedFormFields = computed<string[]>(() => state.selectedFormFields);

  // is batch form getters
  const isBatchForm = computed<boolean>(() => store.getters[`${ns}/isBatchForm`]);

  // form list ids getters
  const formListIds = computed<string[]>(() => store.getters[`${ns}/formListIds`]);

  const validateForm = async () => {
    if (isBatchForm.value && activeDialogKey.value === 'create') {
      let valid = true;
      for (const formRef of formTableFieldRefsMap.value.values()) {
        try {
          await formRef.value?.validate?.();
        } catch (e) {
          valid = false;
        }
      }
      return valid;
    } else {
      return await formRef.value?.validate();
    }
  };

  const resetForm = () => {
    if (isBatchForm.value) {
      switch (activeDialogKey.value) {
        case 'create':
          formList.value = getNewFormList();
          break;
        case 'edit':
          formList.value = cloneArray(state.formList);
          break;
      }
    } else {
      switch (activeDialogKey.value) {
        case 'create':
          form.value = getNewForm();
          break;
        case 'edit':
          form.value = plainClone(state.form);
          formRef.value?.clearValidate();
          break;
      }
      formRef.value?.resetFields();
    }
    formTableFieldRefsMap.value = new Map();
  };

  // reset form when activeDialogKey is changed
  watch(() => state.activeDialogKey, resetForm);
  watch(() => isBatchForm.value, resetForm);

  // whether form item is disabled
  const isFormItemDisabled = (prop: string) => {
    if (!isSelectiveForm.value) return false;
    if (!prop) return false;
    return !selectedFormFields.value.includes(prop);
  };

  // whether the form is empty
  const isEmptyForm = (d: any): boolean => {
    return JSON.stringify(d) === JSON.stringify(getNewForm());
  };
  provide<(d: any) => boolean>('fn:isEmptyForm', isEmptyForm);

  // all list select options
  const allListSelectOptions = computed<SelectOption[]>(() => store.getters[`${ns}/allListSelectOptions`]);

  // all tags
  const allTags = computed<string[]>(() => store.getters[`${ns}/allTags`]);

  const {
    getList,
    create,
    updateById,
    createList,
    updateList,
  } = services;

  // dialog create edit
  const createEditDialogVisible = computed<boolean>(() => {
    const {activeDialogKey} = state;
    if (!activeDialogKey) return false;
    return ['create', 'edit'].includes(activeDialogKey);
  });

  // dialog create edit tab name
  const createEditDialogTabName = computed<CreateEditTabName>(() => state.createEditDialogTabName);

  // dialog confirm
  const confirmDisabled = computed<boolean>(() => {
    return isSelectiveForm.value &&
      selectedFormFields.value.length === 0;
  });
  const confirmLoading = computed<boolean>(() => state.confirmLoading);
  const setConfirmLoading = (value: boolean) => store.commit(`${ns}/setConfirmLoading`, value);
  const onConfirm = async () => {
    // validate
    try {
      const valid = await validateForm();
      if (!valid) return;
    } catch (ex) {
      console.error(ex);
      return;
    }
    if (!form.value) {
      console.error(new Error('project form is undefined'));
      return;
    }

    // flag of request finished
    let isRequestFinished = false;

    // start loading
    setTimeout(() => {
      if (isRequestFinished) return;
      setConfirmLoading(true);
    }, 50);

    // request
    try {
      let res: HttpResponse;
      switch (activeDialogKey.value) {
        case 'create':
          if (isBatchForm.value) {
            const changedFormList = formList.value.filter(d => !isEmptyForm(d));
            res = await createList(changedFormList);
          } else {
            res = await create(form.value);
          }
          break;
        case 'edit':
          if (isBatchForm.value) {
            res = await updateList(formListIds.value, form.value, selectedFormFields.value);
          } else {
            res = await updateById(form.value._id as string, form.value);
          }
          break;
        default:
          console.error(`activeDialogKey "${activeDialogKey.value}" is invalid`);
          return;
      }
      if (res.error) {
        console.error(res.error);
        return;
      }
    } finally {
      // flag request finished as true
      isRequestFinished = true;

      // stop loading
      setConfirmLoading(false);
    }

    // close
    store.commit(`${ns}/hideDialog`);

    // request list
    await getList();
  };

  // dialog close
  const onClose = () => {
    store.commit(`${ns}/hideDialog`);
  };

  // dialog tab change
  const onTabChange = (tabName: CreateEditTabName) => {
    if (tabName === 'batch') {
      formList.value = getNewFormList();
    }
    store.commit(`${ns}/setCreateEditDialogTabName`, tabName);
  };

  // use form table
  const formTable = useFormTable(ns, store, services, data);
  const {
    onAdd,
    onClone,
    onDelete,
    onFieldChange,
    onFieldRegister,
  } = formTable;

  // action functions
  const actionFunctions = {
    onClose,
    onConfirm,
    onTabChange,
    onAdd,
    onClone,
    onDelete,
    onFieldChange,
    onFieldRegister,
  } as CreateEditDialogActionFunctions;

  return {
    ...formTable,
    form,
    formRef,
    isSelectiveForm,
    selectedFormFields,
    formList,
    isBatchForm,
    validateForm,
    resetForm,
    isFormItemDisabled,
    activeDialogKey,
    createEditDialogTabName,
    createEditDialogVisible,
    allListSelectOptions,
    allTags,
    confirmDisabled,
    confirmLoading,
    setConfirmLoading,
    actionFunctions,
  };
};

export default useForm;
