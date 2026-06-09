import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import TopBanner from '@proton/components/containers/topBanners/TopBanner';
import { useModalState } from '@proton/components/index';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';

import PasswordReminderModal from './PasswordReminderModal';
import { usePasswordReminder } from './hooks';
import { dismissPasswordReminder, passwordReminderActions } from './index';
import { usePasswordReminderTelemetry } from './passwordReminderTelemetry';

const PasswordReminderTopBanner = () => {
    const dispatch = useDispatch();
    const { sendDismiss } = usePasswordReminderTelemetry();

    const [passwordReminderModalProps, setPasswordReminderModalOpen, renderPasswordReminderModal] = useModalState();

    const { showReminders } = usePasswordReminder();
    if (!showReminders) {
        return null;
    }

    const dismissReminder = async () => {
        // Let's hide the banner in local state, and then fire and forget the delete call
        dispatch(passwordReminderActions.hideReminders());

        sendDismiss();
        await dispatch(dismissPasswordReminder());
    };

    const verifyButton = (
        <InlineLinkButton key="verify-button" onClick={() => setPasswordReminderModalOpen(true)}>
            {c('Action').t`Verify now`}
        </InlineLinkButton>
    );

    return (
        <>
            {renderPasswordReminderModal && (
                <PasswordReminderModal {...passwordReminderModalProps} source="top_banner" />
            )}
            <TopBanner className="bg-info" onClose={dismissReminder}>
                {
                    // Translator: Full sentence "Do you remember your password? Verify now"
                    c('Info').jt`Do you remember your password? ${verifyButton}`
                }
            </TopBanner>
        </>
    );
};

export default PasswordReminderTopBanner;
