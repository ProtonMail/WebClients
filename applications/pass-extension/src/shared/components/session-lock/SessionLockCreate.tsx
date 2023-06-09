import { type VFC, useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { c } from 'ttag';

import { useNotifications } from '@proton/components/index';
import { sessionLockEnableIntent } from '@proton/pass/store';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { useSessionLockConfirmContext } from './SessionLockConfirmContextProvider';
import { SessionLockPinModal } from './SessionLockPinModal';

type Props = {
    opened: boolean;
    onClose: () => void;
};

export const SessionLockCreate: VFC<Props> = ({ opened, onClose }) => {
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();
    const { confirmPin } = useSessionLockConfirmContext();

    const handleOnSubmit = useCallback(
        async (pin: string) => {
            onClose();

            const options: Parameters<typeof confirmPin>[0] = {
                title: c('Title').t`Confirm PIN code`,
                assistiveText: c('Info').t`Please confirm your PIN code to finish registering your auto-lock settings.`,
                onError: () => confirmPin(options) /* recurse on error */,
                onSubmit: (pinConfirmation) => {
                    if (pin !== pinConfirmation) {
                        createNotification({
                            type: 'error',
                            text: c('Error').t`PIN codes do not match`,
                        });
                        throw new Error('invalid');
                    }

                    dispatch(sessionLockEnableIntent({ pin: pinConfirmation, ttl: 900 /* default to 15 minutes */ }));
                },
            };

            await confirmPin(options);
        },
        [onClose]
    );

    return (
        <SessionLockPinModal
            open={opened}
            title={c('Title').t`Create PIN code`}
            assistiveText={c('Info')
                .t`You will use this PIN to unlock ${PASS_APP_NAME} once it auto-locks after a period of inactivity.`}
            onSubmit={handleOnSubmit}
            onClose={onClose}
        />
    );
};
