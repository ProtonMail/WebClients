import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import TopBanner from '@proton/components/containers/topBanners/TopBanner';
import { useModalState } from '@proton/components/index';
import { IcArrowOutSquare } from '@proton/icons/icons/IcArrowOutSquare';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import PasswordReminderModal from './PasswordReminderModal';
import { usePasswordReminder } from './hooks';
import { dismissPasswordReminder, passwordReminderActions } from './index';
import { usePasswordReminderTelemetry } from './passwordReminderTelemetry';

const PasswordReminderTopBanner = () => {
    const dispatch = useDispatch();
    const { sendBannerDisplay, sendDismiss } = usePasswordReminderTelemetry();

    const [passwordReminderModalProps, setPasswordReminderModalOpen, renderPasswordReminderModal] = useModalState();

    const { showReminders } = usePasswordReminder();

    useEffect(() => {
        if (showReminders) {
            sendBannerDisplay('top_banner');
        }
    }, [showReminders]);

    if (!showReminders) {
        return null;
    }

    const dismissReminder = async () => {
        // Let's hide the banner in local state, and then fire and forget the delete call
        dispatch(passwordReminderActions.hideReminders());

        sendDismiss();
        await dispatch(dismissPasswordReminder());
    };

    return (
        <>
            {renderPasswordReminderModal && (
                <PasswordReminderModal {...passwordReminderModalProps} source="top_banner" />
            )}
            <TopBanner
                className="bg-info"
                innerClassName="flex gap-x-4 items-center justify-center"
                innerPadding="p-1"
                onClose={dismissReminder}
            >
                {c('Info').jt`Do you remember your password?`}
                <Button
                    size="small"
                    shape="outline"
                    key="verify-button"
                    onClick={() => setPasswordReminderModalOpen(true)}
                >
                    {c('Action').t`Verify now`}
                </Button>
                <ButtonLike
                    as="a"
                    href={getKnowledgeBaseUrl('/password-check-in')}
                    size="small"
                    shape="underline"
                    key="verify-learn-more-button"
                >
                    {c('Info').t`Learn more`}
                    <IcArrowOutSquare className="ml-1 shrink-0" />
                </ButtonLike>
            </TopBanner>
        </>
    );
};

export default PasswordReminderTopBanner;
