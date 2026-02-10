import { useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwo, { type ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';

import { grantDelegatedAccessThunk, resetDelegatedAccessThunk } from '../../../outgoingActions';
import { getMetaOutgoingDelegatedAccess } from '../../../shared/outgoing/helper';
import type { EnrichedOutgoingDelegatedAccess } from '../../../shared/outgoing/interface';
import { useDispatch } from '../../../useDispatch';
import { getFormattedAccessibleAtDate } from '../../date';
import { getDaysFromMilliseconds } from '../../helper';
import userExclamation from '../user-exclamation.svg';

export interface ViewAccessOutgoingEmergencyContactModalProps extends Omit<
    ModalProps<'form'>,
    'children' | 'buttons' | 'onSubmit'
> {
    value: EnrichedOutgoingDelegatedAccess;
}

export const ViewOutgoingEmergencyContactModal = ({ value, ...rest }: ViewAccessOutgoingEmergencyContactModalProps) => {
    const handleError = useErrorHandler();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();

    const [loading, withLoading] = useLoading();

    const [loadingType, setLoadingType] = useState<'refuse' | 'grant' | null>(null);
    const formattedAccessibleAt =
        getFormattedAccessibleAtDate(value.parsedOutgoingDelegatedAccess.accessibleAtDate) || '';

    const now = Date.now();
    const meta = getMetaOutgoingDelegatedAccess({ now, value, userContext: { hasInactiveKeys: null } });
    const days = meta.accessibleAtTimeDiff !== null ? getDaysFromMilliseconds(meta.accessibleAtTimeDiff) : 0;

    const user = (
        <span key="user" className="text-bold text-break">
            {value.parsedOutgoingDelegatedAccess.contact.formatted}
        </span>
    );

    return (
        <ModalTwo {...rest} size="small" as="form">
            <ModalTwoHeader title={c('emergency_access').t`Emergency access request`} />
            <ModalTwoContent>
                <div className="mb-6 text-center p-4 border border-weak rounded-lg">
                    <div className="mb-3">
                        <img src={userExclamation} alt="" />
                    </div>
                    <div>{c('emergency_access').jt`${user} is requesting emergency access to your account`}</div>
                </div>
                <div>
                    <p className="my-0">
                        {getBoldFormattedText(
                            c('emergency_access').ngettext(
                                msgid`They will receive access automatically in **${days} day**, on **${formattedAccessibleAt}**, you can reject their request or give them access immediately at any time.`,
                                `They will receive access automatically in **${days} days**, on **${formattedAccessibleAt}**, you can reject their request or give them access immediately at any time.`,
                                days
                            )
                        )}
                    </p>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button
                    loading={loading && loadingType === 'grant'}
                    fullWidth
                    onClick={() => {
                        if (loading) {
                            return;
                        }
                        setLoadingType('grant');
                        void withLoading(async function run() {
                            try {
                                await dispatch(grantDelegatedAccessThunk(value.outgoingDelegatedAccess));
                                createNotification({ text: c('emergency_access').t`Emergency access granted` });
                                rest.onClose?.();
                            } catch (e) {
                                handleError(e);
                            }
                        });
                    }}
                >{c('emergency_access').t`Give access now`}</Button>
                <Button
                    color="danger"
                    fullWidth
                    loading={loading && loadingType === 'refuse'}
                    onClick={() => {
                        if (loading) {
                            return;
                        }
                        setLoadingType('refuse');
                        void withLoading(
                            (async function run() {
                                try {
                                    await dispatch(
                                        resetDelegatedAccessThunk({
                                            id: value.outgoingDelegatedAccess.DelegatedAccessID,
                                        })
                                    );
                                    createNotification({ text: c('emergency_access').t`Emergency access refused` });
                                    rest.onClose?.();
                                } catch (e) {
                                    handleError(e);
                                }
                            })()
                        );
                    }}
                >
                    {c('emergency_access').t`Refuse access`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
