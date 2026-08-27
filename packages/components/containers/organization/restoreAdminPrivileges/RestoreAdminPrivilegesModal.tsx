import { useState } from 'react';

import { c, msgid } from 'ttag';

import { resetOrganizationKeyWithPrivatization } from '@proton/account';
import { OutgoingDelegatedAccessProvider } from '@proton/account/delegatedAccess/shared/OutgoingDelegatedAccessProvider';
import { selectOrganizationKeyResetState } from '@proton/account/organizationKey/resetOrganizationKey';
import { useNotifications } from '@proton/app-context/useNotifications';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { useLoading } from '@proton/hooks';
import { useDispatch, useSelector } from '@proton/redux-shared-store/sharedProvider';
import { getMemberHasOrgKeyResetPrivatization } from '@proton/shared/lib/keys/memberHelper';
import noop from '@proton/utils/noop';

import type { ModalProps } from '../../../components/modalTwo/Modal';
import ModalTwo from '../../../components/modalTwo/Modal';
import ModalTwoContent from '../../../components/modalTwo/ModalContent';
import ModalTwoHeader from '../../../components/modalTwo/ModalHeader';
import useErrorHandler from '../../../hooks/useErrorHandler';
import ContactAdministratorsStep from './ContactAdministratorsStep';
import ConvertUsersStep from './ConvertUsersStep';
import DataRecoveryStep from './DataRecoveryStep';
import NonPrivateUsersListStep from './NonPrivateUsersListStep';
import NotifyUsersStep from './NotifyUsersStep';
import ResetConfirmStep from './ResetConfirmStep';
import type { ResetProgress } from './ResettingStep';
import ResettingStep, { initialResetProgress } from './ResettingStep';
import SuccessStep from './SuccessStep';
import type { RestoreAdminPrivilegesStep } from './interface';

/** Steps that render a narrower modal, matching the design. */
const smallSteps: RestoreAdminPrivilegesStep[] = ['reset-confirm', 'resetting', 'success'];

const InnerRestoreAdminPrivilegesModal = ({ onClose, ...rest }: ModalProps) => {
    const dispatch = useDispatch();
    const errorHandler = useErrorHandler();
    const { createNotification } = useNotifications();
    const { loaded, keyReactivationRequests, otherAdminsWithKeyAccess, affectedMembers } = useSelector(
        selectOrganizationKeyResetState
    );

    const [loading, withLoading] = useLoading();
    const [progress, setProgress] = useState<ResetProgress>(initialResetProgress);

    const getMemberCheckStep = (): RestoreAdminPrivilegesStep =>
        affectedMembers.length ? 'convert-users' : 'reset-confirm';

    /**
     * Where the flow starts depends on the member list and on the inactive keys, so it stays derived rather than
     * stored: until those have loaded there is no entry step to speak of, and the modal shows a loader instead.
     */
    const getEntryStep = (): RestoreAdminPrivilegesStep | null => {
        if (!loaded) {
            return null;
        }
        // A previous attempt already converted members, so the reset is half-done: pick it back up at the
        // confirmation instead of re-explaining a conversion that has already happened.
        if (affectedMembers.some(getMemberHasOrgKeyResetPrivatization)) {
            return 'notify-users';
        }
        if (keyReactivationRequests.length) {
            return 'data-recovery';
        }
        if (otherAdminsWithKeyAccess.length) {
            return 'contact-administrators';
        }
        return getMemberCheckStep();
    };

    /** Null until the user moves off the entry step. */
    const [selectedStep, setStep] = useState<RestoreAdminPrivilegesStep | null>(null);
    const step = selectedStep ?? getEntryStep();

    /** The step the users list was opened from, since it is reachable from both confirmation steps. */
    const [listReturnStep, setListReturnStep] = useState<RestoreAdminPrivilegesStep>('convert-users');

    const handleClose = () => onClose?.();

    const handleTryAnotherWay = () => {
        if (step === 'data-recovery' && otherAdminsWithKeyAccess.length) {
            setStep('contact-administrators');
            return;
        }
        setStep(getMemberCheckStep());
    };

    const handleShowUsers = (from: RestoreAdminPrivilegesStep) => {
        setListReturnStep(from);
        setStep('users-list');
    };

    const handleReset = async () => {
        try {
            const { failure } = await dispatch(
                resetOrganizationKeyWithPrivatization({
                    onStep: (resetStep, status) => {
                        setProgress((previous) => ({
                            ...previous,
                            [resetStep]: status === 'done' ? 'done' : 'running',
                        }));
                    },
                })
            );
            if (failure.length) {
                // The key itself was reset, so this is not a failure of the flow. These members keep their flag and
                // are retried the next time the member list loads.
                const n = failure.length;
                createNotification({
                    type: 'warning',
                    text: c('organization key reset').ngettext(
                        msgid`Could not send the unprivatization request to ${n} user. It will be retried automatically.`,
                        `Could not send the unprivatization request to ${n} users. They will be retried automatically.`,
                        n
                    ),
                });
            }
            setStep('success');
        } catch (error) {
            errorHandler(error);
            setProgress(initialResetProgress);
            throw error;
        }
    };

    const content = (() => {
        switch (step) {
            case null:
                return (
                    <>
                        <ModalTwoHeader title={c('Title').t`Restore administrator privileges`} />
                        <ModalTwoContent>
                            <div className="text-center">
                                <CircleLoader />
                            </div>
                        </ModalTwoContent>
                    </>
                );
            case 'data-recovery':
                return (
                    <DataRecoveryStep
                        keyReactivationRequests={keyReactivationRequests}
                        onTryAnotherWay={handleTryAnotherWay}
                        onRecovered={handleClose}
                    />
                );
            case 'contact-administrators':
                return (
                    <ContactAdministratorsStep
                        administrators={otherAdminsWithKeyAccess}
                        onTryAnotherWay={handleTryAnotherWay}
                        onDone={handleClose}
                    />
                );
            case 'reset-confirm':
                return (
                    <ResetConfirmStep
                        loading={loading}
                        onConfirm={() => {
                            withLoading(handleReset()).catch(noop);
                        }}
                        onClose={handleClose}
                    />
                );
            case 'convert-users':
                return (
                    <ConvertUsersStep
                        nonPrivateMembers={affectedMembers}
                        onShowUsers={() => handleShowUsers('convert-users')}
                        onContinue={() => setStep('notify-users')}
                        onClose={handleClose}
                    />
                );
            case 'notify-users':
                return (
                    <NotifyUsersStep
                        nonPrivateMembers={affectedMembers}
                        onShowUsers={() => handleShowUsers('notify-users')}
                        onReset={() => {
                            setStep('resetting');
                            withLoading(handleReset()).catch(() => setStep('notify-users'));
                        }}
                        onClose={handleClose}
                    />
                );
            case 'users-list':
                return (
                    <NonPrivateUsersListStep
                        nonPrivateMembers={affectedMembers}
                        onBack={() => setStep(listReturnStep)}
                    />
                );
            case 'resetting':
                return <ResettingStep progress={progress} affectedMemberCount={affectedMembers.length} />;
            case 'success':
                return <SuccessStep hasConvertedMembers={affectedMembers.length > 0} onDone={handleClose} />;
        }
    })();

    return (
        <ModalTwo
            open
            size={step !== null && smallSteps.includes(step) ? 'small' : 'medium'}
            disableCloseOnEscape={loading}
            {...rest}
            onClose={loading ? noop : handleClose}
        >
            {content}
        </ModalTwo>
    );
};

/** The data recovery step offers recovery contacts, which need the outgoing delegated access controller. */
const RestoreAdminPrivilegesModal = (props: ModalProps) => {
    return (
        <OutgoingDelegatedAccessProvider>
            <InnerRestoreAdminPrivilegesModal {...props} />
        </OutgoingDelegatedAccessProvider>
    );
};

export default RestoreAdminPrivilegesModal;
