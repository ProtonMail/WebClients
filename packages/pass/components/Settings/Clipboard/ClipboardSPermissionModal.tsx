import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

type Props = {
    onClose: () => void;
};

export const ClipboardPermissionModal: FC<Props> = ({ onClose }) => {
    const handleOk = async () => {
        // Read and forget clipboard content, this is meant to trigger permission request
        await navigator.clipboard.readText();
        onClose();
    };

    return (
        <PassModal onClose={onClose} open>
            <ModalTwoHeader title={c('Title').t`Clipboard permission`} />
            <ModalTwoContent>
                <p>{c('Info')
                    .t`This feature requires ${PASS_APP_NAME} to access your clipboard. Therefore you will be asked to grant clipboard permission by your browser.`}</p>
            </ModalTwoContent>
            <ModalTwoFooter className="justify-between">
                <Button color="norm" onClick={onClose}>
                    {c('Action').t`Cancel`}
                </Button>

                <Button color="norm" onClick={handleOk}>
                    {c('Action').t`Ok`}
                </Button>
            </ModalTwoFooter>
        </PassModal>
    );
};
