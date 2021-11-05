import { useStore } from 'react-redux';
import { useCallback } from 'react';
import { RootState } from '../logic/store';
import { attachmentByID } from '../logic/attachments/attachmentsSelectors';

export const useGetAttachment = () => {
    const store = useStore<RootState>();
    return useCallback((ID: string) => attachmentByID(store.getState(), { ID }), []);
};
