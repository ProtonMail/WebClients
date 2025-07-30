import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import ModalTwo, { type ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import { SECOND } from '@proton/shared/lib/constants';

import type { DelegatedAccessTypeEnum, OutgoingDelegatedAccessOutput } from '../../interface';
import type { EnrichedOutgoingDelegatedAccess } from './interface';
import { getWaitTimeOptions } from './waitTimeOptions';

export interface EditOutgoingEmergencyContactModalProps
    extends Omit<ModalProps<'form'>, 'children' | 'buttons' | 'onSubmit'> {
    onEdit: (value: {
        outgoingDelegatedAccess: OutgoingDelegatedAccessOutput;
        triggerDelay: number;
        types: DelegatedAccessTypeEnum;
    }) => void;
    value: EnrichedOutgoingDelegatedAccess;
    loading: boolean;
}

export const EditOutgoingEmergencyContactModal = ({
    loading,
    value,
    onEdit,
    ...rest
}: EditOutgoingEmergencyContactModalProps) => {
    const waitTimeOptions = getWaitTimeOptions();
    const [waitTime, setWaitTime] = useState(() => {
        const existingValue = waitTimeOptions.find(
            (option) => option.value === value.parsedOutgoingDelegatedAccess.accessibleTriggerDelayMs
        );
        if (existingValue) {
            return existingValue.value;
        }
        return waitTimeOptions[3].value;
    });
    const user = (
        <span key="user" className="text-bold text-break">
            {value.parsedOutgoingDelegatedAccess.contact.formatted}
        </span>
    );

    return (
        <ModalTwo
            {...rest}
            size="small"
            as="form"
            onSubmit={(e) => {
                e.preventDefault();
                if (loading) {
                    return;
                }
                onEdit({
                    triggerDelay: waitTime / SECOND,
                    outgoingDelegatedAccess: value.outgoingDelegatedAccess,
                    types: value.outgoingDelegatedAccess.Types,
                });
            }}
        >
            <ModalTwoHeader title={c('emergency_access').t`Change access wait time`} />
            <ModalTwoContent>
                <div className="mb-6">
                    {c('emergency_access')
                        .jt`Change the time that ${user} will have to wait before automatically giving them access.`}
                </div>
                <div>
                    <InputFieldTwo
                        as={SelectTwo<number>}
                        id="wait-time"
                        label={c('emergency_access').t`Wait time for access`}
                        value={waitTime}
                        onValue={setWaitTime}
                        disabled={loading}
                        assistiveText={c('emergency_access').t`Time required before automatically giving access`}
                    >
                        {waitTimeOptions.map(({ value, label }) => (
                            <Option key={value} value={value} title={label} />
                        ))}
                    </InputFieldTwo>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>
                <Button color="norm" loading={loading} type="submit">{c('Action').t`Save`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
