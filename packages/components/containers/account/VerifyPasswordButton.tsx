import { c } from 'ttag';

import PasswordReminderModal from '@proton/account/passwordReminder/PasswordReminderModal';
import { usePasswordReminder } from '@proton/account/passwordReminder/hooks';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
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
            <InlineLinkButton className="text-sm self-start" onClick={() => setPasswordReminderModalOpen(true)}>
                {c('Action').t`Verify password`}
            </InlineLinkButton>
        </>
    );
};

export default VerifyPasswordButton;
