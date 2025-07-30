import { useCallback, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import useModalState from '@proton/components/components/modalTwo/useModalState';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useContactEmails } from '@proton/mail/store/contactEmails/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';

import { useAddresses } from '../../../addresses/hooks';
import ValidationError from '../../../delegatedAccess/ValidationError';
import { useProtonDomains } from '../../../protonDomains/hooks';
import { addDelegatedAccessThunk } from '../../outgoingActions';
import {
    AddOutgoingEmergencyContactModal,
    type AddOutgoingEmergencyContactModalProps,
} from './AddOutgoingEmergencyContactModal';
import { useOutgoingController } from './OutgoingController';

export const AddOutgoingEmergencyContactAction = () => {
    const { subscribe, items } = useOutgoingController();
    const [modal, setModalOpen, renderModal] = useModalState();

    const handleError = useErrorHandler();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();

    const [addresses] = useAddresses();
    const [contactEmails] = useContactEmails();
    const [{ protonDomains, premiumDomains }] = useProtonDomains();
    const domains = useMemo(() => {
        return new Set([...protonDomains, ...premiumDomains]);
    }, [protonDomains, premiumDomains]);

    const existingOutgoingTargetEmails = useMemo(() => {
        return new Set(items.map((value) => value.outgoingDelegatedAccess.TargetEmail));
    }, [items]);

    const [asyncError, setAsyncError] = useState<{ email: string; errorMessage: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const action = useCallback(async (payload: Parameters<AddOutgoingEmergencyContactModalProps['onAdd']>[0]) => {
        try {
            setLoading(true);
            await dispatch(addDelegatedAccessThunk(payload));
            createNotification({ text: c('emergency_access').t`Emergency contact added` });
            modal.onClose?.();
        } catch (e) {
            if (e instanceof ValidationError) {
                setAsyncError({ email: payload.targetEmail, errorMessage: e.message });
            } else {
                handleError(e);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        return subscribe((payload) => {
            if (payload.type === 'add') {
                setModalOpen(true);
            }
        });
    }, []);

    return (
        <>
            {renderModal && (
                <AddOutgoingEmergencyContactModal
                    {...modal}
                    loading={loading}
                    asyncError={asyncError}
                    addresses={addresses}
                    protonDomains={domains}
                    onAdd={action}
                    contactEmails={contactEmails}
                    existingOutgoingTargetEmails={existingOutgoingTargetEmails}
                    onExit={() => {
                        modal.onExit();
                        setAsyncError(null);
                    }}
                />
            )}
        </>
    );
};
