import type { ReactNode } from 'react';

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

import { requestDelegatedAccessThunk } from '../../../incomingActions';
import type { EnrichedIncomingDelegatedAccess } from '../../../shared/incoming/interface';
import shield from '../../../shared/shield.svg';
import { useDispatch } from '../../../useDispatch';
import { getDaysFromMilliseconds } from '../../helper';

interface RequestAccessEmergencyContactModalProps extends Omit<ModalProps, 'children' | 'buttons'> {
    value: EnrichedIncomingDelegatedAccess;
}

export const RequestIncomingEmergencyContactModal = ({ value, ...rest }: RequestAccessEmergencyContactModalProps) => {
    const handleError = useErrorHandler();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    const user = value.parsedIncomingDelegatedAccess.contact.formatted;
    const accessibleTriggerDelayMs = value.parsedIncomingDelegatedAccess.accessibleTriggerDelayMs;
    const days = getDaysFromMilliseconds(value.parsedIncomingDelegatedAccess.accessibleTriggerDelayMs);

    return (
        <ModalTwo {...rest} size="small">
            <ModalTwoHeader />
            <ModalTwoContent>
                <div className="mb-6 text-center">
                    <div className="mb-6">
                        <img src={shield} alt="" width={56} height={64} />
                    </div>
                    <h1 className="text-break text-semibold text-2xl">{c('emergency_access').t`Request access?`}</h1>
                </div>
                <p className="mt-0 mb-2">
                    {getBoldFormattedText(
                        c('emergency_access')
                            .t`Only request emergency access when there's a **valid situation** requiring you to manage another user's account.`
                    )}
                </p>
                <p className="mt-0 mb-2 text-break">
                    {getBoldFormattedText(
                        c('emergency_access').t`We’ll notify **${user}** that you requested emergency access.`
                    )}
                </p>
                {(() => {
                    let text: ReactNode;
                    if (accessibleTriggerDelayMs === 0) {
                        text = c('emergency_access').jt`You'll receive access to their account immediately.`;
                    } else {
                        text = getBoldFormattedText(
                            c('emergency_access').ngettext(
                                msgid`You'll receive access to their account in **${days} day**, or when they approve your request.`,
                                `You'll receive access to their account in **${days} days**, or when they approve your request.`,
                                days
                            )
                        );
                    }
                    if (text) {
                        return <p className="mt-0 mb-2">{text}</p>;
                    }
                    return null;
                })()}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>
                <Button
                    color="norm"
                    loading={loading}
                    type="button"
                    onClick={() => {
                        void withLoading(
                            (async function run() {
                                try {
                                    await dispatch(
                                        requestDelegatedAccessThunk({
                                            id: value.incomingDelegatedAccess.DelegatedAccessID,
                                        })
                                    );
                                    createNotification({ text: c('emergency_access').t`Emergency access requested` });
                                    rest.onClose?.();
                                } catch (e) {
                                    handleError(e);
                                }
                            })()
                        );
                    }}
                >{c('Action').t`Continue`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
