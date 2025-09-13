import { type FC, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Checkbox, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { useSetClipboardTTL } from '@proton/pass/components/Settings/Clipboard/ClipboardProvider';

type Props = { onClose: (overrideClipboardTTL: number) => void };

export const ClipboardSettingsModal: FC<Props> = ({ onClose }) => {
    const [notAgain, setNotAgain] = useState(false);
    const setClipboardTTL = useSetClipboardTTL();

    const handleClose = async (overrideClipboardTTL: number) => {
        if (notAgain) setClipboardTTL(overrideClipboardTTL);
        onClose(overrideClipboardTTL);
    };

    return (
        <PassModal onClose={() => onClose(-1)} open>
            <ModalTwoHeader title={c('Title').t`Clear clipboard`} />
            <ModalTwoContent>
                <p>{c('Confirm').t`Do you want your clipboard automatically cleared after 2 minutes?`}</p>
                <p className="color-weak">{c('Permission').t`Will require a permission from your browser`}</p>
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
