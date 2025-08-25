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
import { IcExclamationCircle } from '@proton/icons';

import { EventDetailsRow } from '../videoConferencing/EventDetailsRow';
import { useProtonMeetRowContext } from './ProtonMeetRowContext';

export const ProtonMeetPassword = () => {
    const notifications = useNotifications();

    const { passphrase, savePassphrase, fetchingDetailsFailed, refetchMeeting } = useProtonMeetRowContext();

    const [modalProps, handleSetOpen, render] = useModalState();

    const [password, setPassword] = useState(passphrase ?? '');

    const modalTitle = passphrase
        ? c('meet_2025 Action').t`Update secret passphrase`
        : c('meet_2025 Action').t`Add secret passphrase`;

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
                text: c('meet_2025 Success').t`Secret passphrase updated`,
            });
        } catch (error) {
            notifications.createNotification({
                key: 'proton-meet-password-error',
                type: 'error',
                text: c('meet_2025 Error').t`Failed to update secret passphrase`,
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
    const isValid = (password.length === 0 && passphrase) || trimmedPassword.length > 0;

    return (
        <>
            {passphrase !== undefined && savePassphrase !== undefined && !fetchingDetailsFailed && (
                <div className="mt-2">
                    {passphrase ? (
                        <>
                            <EventDetailsRow
                                prefix={c('meet_2025 Label').t`Passphrase:`}
                                suffix={passphrase}
                                copySuccessText={c('Notification').t`Passphrase copied to clipboard`}
                            />
                            <Button className="inline-block p-0" shape="underline" onClick={handleOpen} color="norm">
                                {c('meet_2025 Action').t`Update secret passphrase`}
                            </Button>
                        </>
                    ) : (
                        <Button className="p-0" shape="underline" onClick={handleOpen} color="norm">
                            {c('meet_2025 Action').t`Add secret passphrase`}
                        </Button>
                    )}
                </div>
            )}

            {fetchingDetailsFailed && (
                <div className="mt-2 flex gap-1 items-center color-weak">
                    <IcExclamationCircle className="color-danger" size={4} color="danger" />
                    <span>{c('meet_2025 Error').t`Passphrase unavailable`}</span>
                    <Button
                        className="color-weak"
                        onClick={(e) => {
                            // When the user clicks this button, we want to prevent the collapsible from closing
                            e.stopPropagation();
                            void refetchMeeting?.();
                        }}
                        shape="underline"
                    >
                        {c('meet_2025 Action').t`Retry`}
                    </Button>
                </div>
            )}

            {render && (
                <ModalTwo {...modalProps} data-testid="proton-meet-password-modal">
                    <ModalTwoHeader title={modalTitle} />
                    <ModalTwoContent className="flex flex-column justify-space-between gap-4">
                        <div>
                            {c('meet_2025 Info')
                                .t`For extra security, you can set a passphrase. It won’t be included in the calendar invite, remember to share it with your guests separately.`}
                        </div>
                        <InputFieldTwo
                            id="customPassword"
                            name="customPassword"
                            placeholder={c('meet_2025 Placeholder').t`Enter passphrase`}
                            as={PasswordInputTwo}
                            autoComplete="off"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            label={c('meet_2025 Action').t`Passphrase`}
                            maxLength={100}
                        />
                    </ModalTwoContent>
                    <ModalTwoFooter className="flex justify-space-between">
                        <Button onClick={handleClose}>{c('meet_2025 Action').t`Cancel`}</Button>
                        <Button onClick={handleSave} color="norm" disabled={!isValid}>
                            {c('meet_2025 Action').t`Save`}
                        </Button>
                    </ModalTwoFooter>
                </ModalTwo>
            )}
        </>
    );
};
