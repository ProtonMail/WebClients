import { c } from 'ttag';

import PasswordReminderModal from '@proton/account/passwordReminder/PasswordReminderModal';
import { usePasswordReminder } from '@proton/account/passwordReminder/hooks';
import { Button } from '@proton/atoms/Button/Button';
import useModalState from '@proton/components/components/modalTwo/useModalState';

const VerifyPasswordButton = () => {
    const [passwordReminderModalProps, setPasswordReminderModalOpen, renderPasswordReminderModal] = useModalState();

    const { isAvailable, isEnabled } = usePasswordReminder();
    if (!isAvailable || !isEnabled) {
        return null;
    }

    return (
        <>
            {renderPasswordReminderModal && (
                <PasswordReminderModal {...passwordReminderModalProps} source="password_settings" disableDismiss />
            )}
            <Button shape="ghost" color="norm" onClick={() => setPasswordReminderModalOpen(true)}>
                {c('Action').t`Verify password`}
            </Button>
        </>
    );
};

export default VerifyPasswordButton;
