import type { ReactNode } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import ModalTwo, { type ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';

import { getDaysFromMilliseconds } from '../helper';
import shield from '../shield.svg';
import type { EnrichedIncomingDelegatedAccess } from './interface';

interface RequestAccessEmergencyContactModalProps extends Omit<ModalProps, 'children' | 'buttons'> {
    value: EnrichedIncomingDelegatedAccess;
    onRequestAccess: (value: EnrichedIncomingDelegatedAccess) => void;
    loading: boolean;
}

export const RequestAccessIncomingEmergencyContactModal = ({
    value,
    onRequestAccess,
    loading,
    ...rest
}: RequestAccessEmergencyContactModalProps) => {
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
                        onRequestAccess(value);
                    }}
                >{c('Action').t`Continue`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
