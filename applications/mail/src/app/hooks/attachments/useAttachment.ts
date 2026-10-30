import { useCallback } from 'react';

import { attachmentByID } from '@proton/mail-message/store/attachments/attachmentsSelectors';

import { useMailStore } from '../../store/hooks';

export const useGetAttachment = () => {
    const store = useMailStore();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-A9D180
    return useCallback((ID: string) => attachmentByID(store.getState(), { ID }), []);
};
