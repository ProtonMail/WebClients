import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import useModalState from '@proton/components/components/modalTwo/useModalState';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import noop from '@proton/utils/noop';

import RetrySignedKeyListError from '../../../RetrySignedKeyListError';
import { recoverDelegatedAccessStep1Thunk, recoverDelegatedAccessStep2Thunk } from '../../../outgoingActions';
import { RecoverOutgoingRecoveryContactModal } from '../../../recoveryContact/outgoing/modals/RecoverOutgoingRecoveryContactModal';
import { RetryWarningRecoverOutgoingRecoveryContactModal } from '../../../recoveryContact/outgoing/modals/RetryWarningRecoverOutgoingRecoveryContactModal';
import { useDispatch } from '../../../useDispatch';
import { useOutgoingController } from '../../OutgoingDelegatedAccessProvider';
import type { EnrichedOutgoingDelegatedAccess, RecoverActionPayload } from '../interface';

export const RecoverAction = () => {
    const { subscribe } = useOutgoingController();
    const [modal, setModalOpen, renderModal] = useModalState();
    const [warningModal, setWarningModalOpen, renderWarningModal] = useModalState();

    const handleError = useErrorHandler();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();

    const [tmpOutgoingDelegatedAccess, setTmpOutgoingDelegatedAccess] =
        useState<EnrichedOutgoingDelegatedAccess | null>(null);

    const recoverStep1 = useCallback(async (value: RecoverActionPayload['value']) => {
        try {
            setTmpOutgoingDelegatedAccess(null);
            await dispatch(
                recoverDelegatedAccessStep1Thunk({ outgoingDelegatedAccess: value.outgoingDelegatedAccess })
            );
            setTmpOutgoingDelegatedAccess(value);
            setModalOpen(true);
        } catch (e) {
            handleError(e);
        }
    }, []);

    const recoverStep2 = useCallback(
        async (value: RecoverActionPayload['value'], options?: { ignoreVerification: boolean }) => {
            try {
                setTmpOutgoingDelegatedAccess(null);
                await dispatch(
                    recoverDelegatedAccessStep2Thunk({
                        outgoingDelegatedAccess: value.outgoingDelegatedAccess,
                        ignoreVerification: options?.ignoreVerification ?? false,
                    })
                );

                createNotification({
                    text: c('emergency_access')
                        .t`Data successfully recovered. You can now decrypt your existing data and encrypted files.`,
                });
            } catch (e) {
                if (e instanceof RetrySignedKeyListError) {
                    setTmpOutgoingDelegatedAccess(value);
                    setWarningModalOpen(true);
                    return;
                }
                handleError(e);
            }
        },
        []
    );

    useEffect(() => {
        return subscribe((payload) => {
            if (payload.type === 'recover') {
                recoverStep1(payload.value).catch(noop);
            }
            if (payload.type === 'recover-token') {
                recoverStep2(payload.value).catch(noop);
            }
            if (payload.type === 'recover-info') {
                setTmpOutgoingDelegatedAccess(payload.value);
                setModalOpen(true);
            }
        });
    }, []);

    return (
        <>
            {renderModal && tmpOutgoingDelegatedAccess && (
                <RecoverOutgoingRecoveryContactModal
                    {...modal}
                    value={tmpOutgoingDelegatedAccess}
                    onExit={() => {
                        modal.onExit();
                        setTmpOutgoingDelegatedAccess(null);
                    }}
                />
            )}
            {renderWarningModal && tmpOutgoingDelegatedAccess && (
                <RetryWarningRecoverOutgoingRecoveryContactModal
                    {...warningModal}
                    onProceed={() => {
                        recoverStep2(tmpOutgoingDelegatedAccess, { ignoreVerification: true }).catch(noop);
                    }}
                    value={tmpOutgoingDelegatedAccess}
                    onExit={() => {
                        modal.onExit();
                        setTmpOutgoingDelegatedAccess(null);
                    }}
                />
            )}
        </>
    );
};
