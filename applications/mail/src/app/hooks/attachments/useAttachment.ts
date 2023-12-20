import { useCallback } from 'react';

import { useMailStore } from 'proton-mail/store/hooks';

import { attachmentByID } from '../../store/attachments/attachmentsSelectors';

export const useGetAttachment = () => {
    const store = useMailStore();
    return useCallback((ID: string) => attachmentByID(store.getState(), { ID }), []);
};
