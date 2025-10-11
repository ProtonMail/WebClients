import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { getDefaultClipboardTTLOption } from '@proton/pass/components/Settings/Clipboard/ClipboardSettings';
import { ClipboardTTL, DEFAULT_CLIPBOARD_TTL } from '@proton/pass/lib/clipboard/types';

type Props = {
    onSubmit: (ttl?: ClipboardTTL) => void;
};

export const ClipboardSettingsModal: FC<Props> = ({ onSubmit }) => {
    const timeoutDurationHumanReadable = getDefaultClipboardTTLOption();

    return (
        <PassModal onClose={() => onSubmit()} size="small" open>
            <ModalTwoHeader title={c('Title').t`Clear clipboard`} />
            <ModalTwoContent>
                <p>{
                    // translator: `timeoutDurationHumanReadable` may be 15 seconds, 1 minute or 2 minutes
                    c('Confirm')
                        .t`Do you want your clipboard automatically cleared after ${timeoutDurationHumanReadable}?`
                }</p>
                {!DESKTOP_BUILD && (
                    <p className="color-weak">{c('Permission').t`Will require a permission from your browser`}</p>
                )}
            </ModalTwoContent>
            <ModalTwoFooter className="justify-between">
                <Button color="weak" onClick={() => onSubmit(ClipboardTTL.TTL_NEVER)}>
                    {c('Action').t`No`}
                </Button>
                <Button color="norm" onClick={() => onSubmit(DEFAULT_CLIPBOARD_TTL)}>
                    {c('Action').t`Yes`}
                </Button>
            </ModalTwoFooter>
        </PassModal>
    );
};
