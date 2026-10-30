import { useCallback } from 'react';

import type { Store } from '@reduxjs/toolkit';

import { baseUseStore } from '@proton/react-redux-store/ProtonStoreContext';

import { attachmentByID } from '../../store/attachments/attachmentsSelectors';
import type { AttachmentsStoreState } from '../../store/attachments/attachmentsTypes';

const useAttachmentsStore = baseUseStore.withTypes<Store<AttachmentsStoreState>>();

export const useGetAttachment = () => {
    const store = useAttachmentsStore();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-A9D180
    return useCallback((ID: string) => attachmentByID(store.getState(), { ID }), []);
};
