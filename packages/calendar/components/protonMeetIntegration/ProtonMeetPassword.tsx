import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    InputFieldTwo,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PasswordInputTwo,
    useModalState,
    useNotifications,
} from '@proton/components';

import { EventDetailsRow } from '../videoConferencing/EventDetailsRow';
import { useProtonMeetRowContext } from './ProtonMeetRowContext';

export const ProtonMeetPassword = () => {
    const notifications = useNotifications();

    const { passphrase, savePassphrase } = useProtonMeetRowContext();

    const [modalProps, handleSetOpen, render] = useModalState();

    const [password, setPassword] = useState(passphrase ?? '');

    const modalTitle = passphrase
        ? c('l10n_nightly Action').t`Update secret passphrase`
        : c('l10n_nightly Action').t`Add secret passphrase`;

    const handleClose = () => {
        handleSetOpen(false);
        setPassword('');
    };

    const handleSave = async () => {
        try {
            await savePassphrase?.(password);
            notifications.createNotification({
                key: 'proton-meet-password-success',
                type: 'success',
                text: c('l10n_nightly Success').t`Secret passphrase updated`,
            });
        } catch (error) {
            notifications.createNotification({
                key: 'proton-meet-password-error',
                type: 'error',
                text: c('l10n_nightly Error').t`Failed to update secret passphrase`,
            });
        }

        handleClose();
    };

    const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        handleSetOpen(true);
        setPassword(passphrase ?? '');
    };

    const trimmedPassword = password.trim();
    const isValid = (password.length === 0 || trimmedPassword.length > 0) && !/\s$/.test(password);

    return (
        <>
            {passphrase !== undefined && savePassphrase !== undefined && (
                <div className="mt-2">
                    {passphrase && (
                        <>
                            <EventDetailsRow
                                prefix={c('l10n_nightly Label').t`Passphrase:`}
                                suffix={passphrase}
                                copySuccessText={c('Notification').t`Passphrase copied to clipboard`}
                            />

                            <Button className="inline-block" shape="underline" onClick={handleOpen} color="norm">
                                {c('l10n_nightly Action').t`Update secret passphrase`}
                            </Button>
                        </>
                    )}
                    {!passphrase && (
                        <Button shape="underline" onClick={handleOpen} color="norm">
                            {c('l10n_nightly Action').t`Add secret passphrase`}
                        </Button>
                    )}
                </div>
            )}

            {render && (
                <ModalTwo {...modalProps} data-testid="proton-meet-password-modal">
                    <ModalTwoHeader title={modalTitle} />
                    <ModalTwoContent className="flex flex-column justify-space-between gap-4">
                        <div>
                            {c('l10n_nightly Info')
                                .t`For extra security, you can set a passphrase. It won’t be included in the calendar invite, remember to share it with your guests separately.`}
                        </div>
                        <InputFieldTwo
                            id="customPassword"
                            name="customPassword"
                            placeholder={c('l10n_nightly Placeholder').t`Enter passphrase`}
                            as={PasswordInputTwo}
                            autoComplete="off"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            label={c('l10n_nightly Action').t`Passphrase`}
                            maxLength={100}
                        />
                    </ModalTwoContent>
                    <ModalTwoFooter className="flex justify-space-between">
                        <Button onClick={handleClose}>{c('l10n_nightly Action').t`Cancel`}</Button>
                        <Button onClick={handleSave} color="norm" disabled={!isValid}>
                            {c('l10n_nightly Action').t`Save`}
                        </Button>
                    </ModalTwoFooter>
                </ModalTwo>
            )}
        </>
    );
};
