import { type FC, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Checkbox, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { useSetClipboardTTL } from '@proton/pass/components/Settings/Clipboard/ClipboardProvider';
import { getDefaultClipboardTTLOption } from '@proton/pass/components/Settings/Clipboard/ClipboardSettings';

type Props = { onClose: (overrideClipboardTTL: number) => void };

export const ClipboardSettingsModal: FC<Props> = ({ onClose }) => {
    const [notAgain, setNotAgain] = useState(false);
    const setClipboardTTL = useSetClipboardTTL();

    const handleClose = (overrideClipboardTTL: number) => {
        /** set the clipboard TTL on close if user discards the modal
         * permanently or agrees on setting the default clipboard TTL. */
        if (notAgain || overrideClipboardTTL > 0) setClipboardTTL(overrideClipboardTTL);
        onClose(overrideClipboardTTL);
    };

    const timeoutDurationHumanReadable = getDefaultClipboardTTLOption()[1];

    return (
        <PassModal onClose={() => onClose(-1)} size="small" open>
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
                <p>
                    <Checkbox checked={notAgain} onChange={() => setNotAgain(!notAgain)}>
                        {c('Confirm').t`Do not ask me again`}
                    </Checkbox>
                </p>
            </ModalTwoContent>
            <ModalTwoFooter className="justify-between">
                <Button color="weak" onClick={() => handleClose(-1)}>
                    {c('Action').t`No`}
                </Button>
                <Button color="norm" onClick={() => handleClose(120_000)}>
                    {c('Action').t`Yes`}
                </Button>
            </ModalTwoFooter>
        </PassModal>
    );
};
