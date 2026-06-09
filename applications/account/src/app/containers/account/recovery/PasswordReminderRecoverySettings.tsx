import { c } from 'ttag';

import PasswordReminderModal from '@proton/account/passwordReminder/PasswordReminderModal';
import { usePasswordReminder } from '@proton/account/passwordReminder/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { useModalState } from '@proton/components/index';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import lock from './lockwithcheck.svg';

const PasswordReminderRecoverySettings = () => {
    const [passwordReminderModalProps, setPasswordReminderModalOpen, renderPasswordReminderModal] = useModalState();

    const { isAvailable } = usePasswordReminder();
    if (!isAvailable) {
        return null;
    }

    return (
        <>
            {renderPasswordReminderModal && (
                <PasswordReminderModal {...passwordReminderModalProps} source="recovery_settings" disableDismiss />
            )}
            <section
                className="rounded-xl bg-elevated p-4 md:p-6 shadow-norm flex flex-column gap-2 lg:flex-row lg:items-center lg:gap-8 flex-nowrap text-center lg:text-left lg:pr-8"
                style={{ background: 'linear-gradient(2deg, rgba(109 74 255 / 0.15) 17%, rgba(70 26 255 / 0.04) 80%)' }}
            >
                <div className="shrink-0">
                    <img src={lock} alt="" width={40} height={40} />
                </div>

                <div className="w-full">
                    <h2 className="m-0 mb-1 text-semibold text-rg">
                        {c('Password reminder').t`Do you remember your ${BRAND_NAME} password?`}
                    </h2>
                    <p className="m-0 text-sm">
                        {c('Password reminder')
                            .t`The best way to avoid losing access to your account and data is to remember your credentials.`}
                    </p>
                </div>

                <div className="shrink-0">
                    <Button onClick={() => setPasswordReminderModalOpen(true)} shape="outline">
                        {c('Action').t`Check now`}
                    </Button>
                </div>
            </section>
        </>
    );
};

export default PasswordReminderRecoverySettings;
