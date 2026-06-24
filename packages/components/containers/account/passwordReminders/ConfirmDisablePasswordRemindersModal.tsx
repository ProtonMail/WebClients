import { c } from 'ttag';

import { usePasswordReminderTelemetry } from '@proton/account/passwordReminder/passwordReminderTelemetry';
import { setPasswordReminderFlag } from '@proton/account/passwordReminder/setPasswordReminderFlag';
import { Button } from '@proton/atoms/Button/Button';
import Prompt from '@proton/components/components/prompt/Prompt';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { PASSWORD_REMINDERS_VALUE } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

interface Props {
    onClose: () => void;
    open: boolean;
}

const ConfirmDisablePasswordRemindersModal = ({ open, onClose }: Props) => {
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();
    const [submitting, withSubmitting] = useLoading();
    const { sendDisable } = usePasswordReminderTelemetry();

    const disablePasswordReminders = async () => {
        await dispatch(setPasswordReminderFlag({ value: PASSWORD_REMINDERS_VALUE.DISABLED }));
        createNotification({ text: c('Success').t`Password check-ins disabled` });
        sendDisable();
        onClose();
    };

    const handleClose = submitting ? noop : onClose;

    return (
        <Prompt
            open={open}
            onClose={handleClose}
            title={c('password_reminder').t`Turn off password check-ins?`}
            buttons={[
                <Button
                    color="danger"
                    loading={submitting}
                    onClick={() => {
                        void withSubmitting(disablePasswordReminders());
                    }}
                >
                    {c('password_reminder').t`Turn off check-ins`}
                </Button>,
                <Button onClick={onClose} disabled={submitting}>
                    {c('Action').t`Cancel`}
                </Button>,
            ]}
        >
            <p>
                {c('password_reminder')
                    .t`Make sure you memorize or securely store your password as it's the key to decrypt your data.`}
            </p>
            <p>{c('password_reminder').t`If you forget your password, you may lose access to your encrypted data.`}</p>
        </Prompt>
    );
};

export default ConfirmDisablePasswordRemindersModal;
