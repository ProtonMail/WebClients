import { useCallback } from 'react';

import { useMailStore } from 'proton-mail/store/hooks';

import { attachmentByID } from '../../store/attachments/attachmentsSelectors';

export const useGetAttachment = () => {
    const store = useMailStore();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-A9D180
    return useCallback((ID: string) => attachmentByID(store.getState(), { ID }), []);
};
