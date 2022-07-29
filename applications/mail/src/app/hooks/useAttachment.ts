import { useCallback } from 'react';
import { useStore } from 'react-redux';

import { attachmentByID } from '../logic/attachments/attachmentsSelectors';
import { RootState } from '../logic/store';

export const useGetAttachment = () => {
    const store = useStore<RootState>();
    return useCallback((ID: string) => attachmentByID(store.getState(), { ID }), []);
};
