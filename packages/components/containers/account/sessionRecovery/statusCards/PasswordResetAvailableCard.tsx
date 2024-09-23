import { format } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { dateLocale } from '@proton/shared/lib/i18n';
import clsx from '@proton/utils/clsx';

import { useUser } from '../../../../hooks';
import ConfirmSessionRecoveryCancellationModal from '../ConfirmSessionRecoveryCancellationModal';
import PasswordResetAvailableAccountModal from '../PasswordResetAvailableAccountModal';
import SessionRecoveryStatusTitle from './SessionRecoveryStatusTitle';
import handWarningIcon from './hand-warning-icon.svg';
import lockIcon from './lock-tick-icon.svg';

interface Props {
    className?: string;
}

const PasswordResetAvailableCard = ({ className }: Props) => {
    const [user] = useUser();
    const [
        sessionRecoveryPasswordResetModal,
        setSessionRecoveryPasswordResetModalOpen,
        renderSessionRecoveryPasswordResetModal,
    ] = useModalState();
    const [confirmCancelModalProps, setConfirmCancelModalOpen, renderConfirmCancelModal] = useModalState();

    if (!user.AccountRecovery) {
        return null;
    }

    const endDate = new Date(user.AccountRecovery.EndTime * 1000);
    const formattedDate = format(endDate, 'PP', { locale: dateLocale });

    const boldDate = <b key="bold-date">{formattedDate}</b>;

    return (
        <>
            {renderSessionRecoveryPasswordResetModal && (
                <PasswordResetAvailableAccountModal {...sessionRecoveryPasswordResetModal} />
            )}
            {renderConfirmCancelModal && <ConfirmSessionRecoveryCancellationModal {...confirmCancelModalProps} />}
            <div className={clsx('max-w-custom rounded-lg border', className)} style={{ '--max-w-custom': '46em' }}>
                <div className="p-6 border-bottom border-weak">
                    <SessionRecoveryStatusTitle status="available" />
                </div>
                <div className="p-6 border-bottom border-weak sm:flex items-start flex-nowrap">
                    <img className="mb-2 sm:mb-0 sm:mr-4 shrink-0" src={lockIcon} alt="" />
                    <div>
                        <h3 className="mb-1 text-bold text-lg">{c('session_recovery:available:info')
                            .t`You can now reset your password`}</h3>
                        <div>{c('session_recovery:available:info')
                            .jt`You can reset your password until ${boldDate}.`}</div>
                        <Button
                            className="mt-4 w-full sm:w-auto"
                            onClick={() => setSessionRecoveryPasswordResetModalOpen(true)}
                            color="norm"
                            shape="outline"
                        >
                            {c('session_recovery:available:action').t`Reset password`}
                        </Button>
                    </div>
                </div>
                <div className="p-6 sm:flex items-start flex-nowrap">
                    <img className="mb-2 sm:mb-0 sm:mr-4 shrink-0" src={handWarningIcon} alt="" />
                    <div>
                        <h3 className="mb-1 text-bold text-lg">{c('session_recovery:available:info')
                            .t`Didn’t make this request?`}</h3>
                        <div className="mb-4">
                            {c('session_recovery:available:info')
                                .t`If you didn’t ask to reset your password, cancel the request now.`}
                        </div>
                        <Button
                            className="w-full sm:w-auto"
                            onClick={() => setConfirmCancelModalOpen(true)}
                            color="danger"
                            shape="outline"
                        >
                            {c('session_recovery:available:action').t`Cancel password reset`}
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PasswordResetAvailableCard;
