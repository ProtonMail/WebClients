import { useState } from 'react';

import { c, msgid } from 'ttag';

import { getFormattedAccessibleAtDate } from '@proton/account/delegatedAccess/emergencyAccess/date';
import { getDaysFromMilliseconds } from '@proton/account/delegatedAccess/emergencyAccess/helper';
import { getMetaOutgoingDelegatedAccess } from '@proton/account/delegatedAccess/emergencyAccess/outgoing/helper';
import { Button } from '@proton/atoms';
import ModalTwo, { type ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';

import type { EnrichedOutgoingDelegatedAccess } from './interface';
import userExclamation from './user-exclamation.svg';

export interface ViewAccessOutgoingEmergencyContactModalProps
    extends Omit<ModalProps<'form'>, 'children' | 'buttons' | 'onSubmit'> {
    onAction: (payload: { type: 'refuse' | 'grant'; value: EnrichedOutgoingDelegatedAccess }) => void;
    value: EnrichedOutgoingDelegatedAccess;
    loading: boolean;
}

export const ViewAccessOutgoingEmergencyContactModal = ({
    loading,
    value,
    onAction,
    ...rest
}: ViewAccessOutgoingEmergencyContactModalProps) => {
    const [loadingType, setLoadingType] = useState<'refuse' | 'grant' | null>(null);
    const formattedAccessibleAt =
        getFormattedAccessibleAtDate(value.parsedOutgoingDelegatedAccess.accessibleAtDate) || '';

    const now = Date.now();
    const meta = getMetaOutgoingDelegatedAccess({ now, value });
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
                    onClick={() => {
                        setLoadingType('grant');
                        onAction({ type: 'grant', value });
                    }}
                >{c('Action').t`Give access now`}</Button>
                <Button
                    color="danger"
                    loading={loading && loadingType === 'refuse'}
                    onClick={() => {
                        setLoadingType('refuse');
                        onAction({ type: 'refuse', value });
                    }}
                >
                    {c('emergency_access').t`Refuse access`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
