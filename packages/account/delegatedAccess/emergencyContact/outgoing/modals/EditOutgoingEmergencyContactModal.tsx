import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwo, { type ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { SECOND } from '@proton/shared/lib/constants';

import { editDelegatedAccessThunk } from '../../../outgoingActions';
import type { EnrichedOutgoingDelegatedAccess } from '../../../shared/outgoing/interface';
import { useDispatch } from '../../../useDispatch';
import { getDefaultWaitTimeOptionValue, getWaitTimeOptions } from './getWaitTimeOptions';

export interface EditOutgoingEmergencyContactModalProps extends Omit<
    ModalProps<'form'>,
    'children' | 'buttons' | 'onSubmit'
> {
    value: EnrichedOutgoingDelegatedAccess;
}

export const EditOutgoingEmergencyContactModal = ({ value, ...rest }: EditOutgoingEmergencyContactModalProps) => {
    const handleError = useErrorHandler();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    const waitTimeOptions = getWaitTimeOptions();
    const [waitTime, setWaitTime] = useState(() => {
        const existingValue = waitTimeOptions.find(
            (option) => option.value === value.parsedOutgoingDelegatedAccess.accessibleTriggerDelayMs
        );
        if (existingValue) {
            return existingValue.value;
        }
        return getDefaultWaitTimeOptionValue();
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
                void withLoading(
                    (async function run() {
                        try {
                            await dispatch(
                                editDelegatedAccessThunk({
                                    triggerDelay: waitTime / SECOND,
                                    outgoingDelegatedAccess: value.outgoingDelegatedAccess,
                                    types: value.outgoingDelegatedAccess.Types,
                                })
                            );
                            createNotification({ text: c('emergency_access').t`Wait time saved` });
                            rest.onClose?.();
                        } catch (e) {
                            handleError(e);
                        }
                    })()
                );
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
