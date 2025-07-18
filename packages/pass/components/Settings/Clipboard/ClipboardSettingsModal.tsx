import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { ClipboardSettings } from '@proton/pass/components/Settings/Clipboard/ClipboardSettings';

type Props = {
    onClose: () => void;
};

export const ClipboardSettingsModal: FC<Props> = ({ onClose }) => {
    return (
        <PassModal onClose={onClose} open>
            <ModalTwoHeader title={c('Title').t`Do you want your clipboard to be cleared after some time?`} />
            <ModalTwoContent>
                <ClipboardSettings initializeSetting />
            </ModalTwoContent>
            <ModalTwoFooter className="justify-end">
                <Button color="norm" onClick={onClose}>
                    {c('Action').t`Ok`}
                </Button>
            </ModalTwoFooter>
        </PassModal>
    );
};
