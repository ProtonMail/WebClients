import React from 'react';

import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader, useModalTwoStatic } from '@proton/components';

const AutoRestoreModal = ({ onClose, open, onExit }: ModalStateProps) => {
    return (
        <ModalTwo size="medium" open={open} onClose={onClose} onExit={onExit}>
            <ModalTwoHeader title={c('Title').t`Automatic Recovery in Progress`} />
            <ModalTwoContent>
                <p>
                    {c('Info')
                        .t`Our systems detected that your previous recovery didn't complete successfully, and some files may not have been fully restored. We've automatically restarted the recovery process to ensure everything is fully restored.`}
                </p>
                <p>
                    {c('Info')
                        .t`Once this process is finished you'll find a copy of your restored data in a new folder called "Automated Recovery (today's date)". This copy of your data will not count against your storage quota.`}
                </p>
                <p>{c('Info').t`We sincerely apologize for the inconvenience this may have caused you.`}</p>
            </ModalTwoContent>
            <ModalTwoFooter />
        </ModalTwo>
    );
};

export default AutoRestoreModal;
export const useAutoRestoreModal = () => {
    return useModalTwoStatic(AutoRestoreModal);
};
