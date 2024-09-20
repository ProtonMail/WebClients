import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useLoading from '@proton/hooks/useLoading';
import metrics, { observeApiError } from '@proton/metrics';
import { initiateSessionRecovery } from '@proton/shared/lib/api/sessionRecovery';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import noop from '@proton/utils/noop';

import { useApi, useAvailableRecoveryMethods, useEventManager, useNotifications, useUser } from '../../../hooks';
import SessionRecoveryResetConfirmedPrompt from './SessionRecoveryResetConfirmedPrompt';
import sessionRecoveryIllustration from './session-recovery-illustration.svg';

enum STEP {
    PROMPT,
    RESET_CONFIRMED,
}

interface Props extends ModalProps {
    confirmedStep?: boolean;
    onUseRecoveryMethodClick: () => void;
}

const InitiateSessionRecoveryModal = ({ confirmedStep = false, onUseRecoveryMethodClick, onClose, ...rest }: Props) => {
    const [user] = useUser();
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [availableRecoveryMethods] = useAvailableRecoveryMethods();
    const hasRecoveryMethod = availableRecoveryMethods.length > 0;

    const [step, setStep] = useState<STEP>(STEP.PROMPT);

    const [submitting, withSubmitting] = useLoading();

    useEffect(() => {
        const metricsStep = (() => {
            if (step === STEP.PROMPT) {
                return 'prompt';
            }

            if (step === STEP.RESET_CONFIRMED) {
                return 'confirmed';
            }
        })();

        if (!metricsStep) {
            return;
        }

        metrics.core_session_recovery_initiation_modal_load_total.increment({
            step: metricsStep,
        });
    }, [step]);

    if (step === STEP.RESET_CONFIRMED) {
        return <SessionRecoveryResetConfirmedPrompt open={rest.open} onClose={onClose} />;
    }

    const handleInitiateSessionRecovery = async () => {
        try {
            await api(initiateSessionRecovery());
            await call();
            createNotification({
                text: c('session_recovery:initiation:notification').t`Password reset confirmed`,
                showCloseButton: false,
            });

            metrics.core_session_recovery_initiation_total.increment({
                status: 'success',
            });

            if (confirmedStep) {
                setStep(STEP.RESET_CONFIRMED);
            } else {
                onClose?.();
            }
        } catch (error) {
            observeApiError(
                error,
                (status) =>
                    metrics.core_session_recovery_initiation_total.increment({
                        status,
                    }),
                [API_CUSTOM_ERROR_CODES.NOT_ALLOWED]
            );
        }
    };

    const handleClose = submitting ? noop : onClose;

    return (
        <Modal onClose={handleClose} {...rest}>
            <ModalHeader
                title={c('session_recovery:initiation:title').t`Request password reset?`}
                subline={user.Email}
            />
            <ModalContent>
                <div className="flex justify-center">
                    <img src={sessionRecoveryIllustration} alt="" />
                </div>

                <p>
                    {getBoldFormattedText(
                        c('session_recovery:initiation:info')
                            .t`For security reasons, you’ll have to wait **72 hours** before you can change your password.`
                    )}
                </p>
                {hasRecoveryMethod && (
                    <p>
                        {getBoldFormattedText(
                            c('session_recovery:initiation:info')
                                .t`If you have a **recovery method** set up, try account recovery instead. This will allow you to change your password straight away.`
                        )}
                    </p>
                )}
            </ModalContent>
            <ModalFooter>
                {hasRecoveryMethod ? (
                    <Button onClick={onUseRecoveryMethodClick} disabled={submitting}>
                        {c('session_recovery:initiation:action').t`Use recovery method`}
                    </Button>
                ) : (
                    <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                )}
                <Button
                    onClick={() => withSubmitting(handleInitiateSessionRecovery())}
                    loading={submitting}
                    color="danger"
                >
                    {c('session_recovery:initiation:action').t`Request password reset`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default InitiateSessionRecoveryModal;
