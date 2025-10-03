import { type FC, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { getDefaultClipboardTTLOption } from '@proton/pass/components/Settings/Clipboard/ClipboardSettings';
import { ClipboardTTL, DEFAULT_CLIPBOARD_TTL } from '@proton/pass/lib/clipboard/types';

type Props = {
    checkPermissions: () => Promise<boolean>;
    onSubmit: (hasPermissions: boolean, ttl?: ClipboardTTL) => void;
};

export const ClipboardSettingsModal: FC<Props> = ({ checkPermissions, onSubmit }) => {
    const [hasPermissions, setHasPermissions] = useState<boolean>(false);

    /** Fetching permissions status async to have the result ready when the user submits.
     * On FF, permission requests need to be strictly synchronous after a user event so
     * permission check has to be performed before (see `ExtensionCore.tsx`) */
    useEffect(() => {
        void (async () => setHasPermissions(await checkPermissions()))();
    }, []);

    const timeoutDurationHumanReadable = getDefaultClipboardTTLOption();

    return (
        <PassModal onClose={() => onSubmit(hasPermissions)} size="small" open>
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
                <Button color="weak" onClick={() => onSubmit(hasPermissions, ClipboardTTL.TTL_NEVER)}>
                    {c('Action').t`No`}
                </Button>
                <Button color="norm" onClick={() => onSubmit(hasPermissions, DEFAULT_CLIPBOARD_TTL)}>
                    {c('Action').t`Yes`}
                </Button>
            </ModalTwoFooter>
        </PassModal>
    );
};
