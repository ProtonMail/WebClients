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
import { BRAND_NAME, SECOND } from '@proton/shared/lib/constants';

import ValidationError from '../../../ValidationError';
import { DelegatedAccessTypeEnum } from '../../../interface';
import { addDelegatedAccessThunk } from '../../../outgoingActions';
import ContactEmailInput, { type ContactEmailInputProps } from '../../../shared/outgoing/ContactEmailInput';
import shield from '../../../shared/shield.svg';
import { useDispatch } from '../../../useDispatch';
import { getDefaultWaitTimeOptionValue, getWaitTimeOptions } from './getWaitTimeOptions';

export interface CreateOutgoingEmergencyContactModalProps extends Omit<
    ModalProps<'form'>,
    'children' | 'buttons' | 'onSubmit'
> {
    existingOutgoingTargetEmails: Set<string>;
    contactEmails: ContactEmailInputProps['contactEmails'];
    addresses: ContactEmailInputProps['addresses'];
    protonDomains: ContactEmailInputProps['protonDomains'];
}

export const CreateOutgoingEmergencyContactModal = ({
    protonDomains,
    addresses,
    existingOutgoingTargetEmails,
    contactEmails,
    ...rest
}: CreateOutgoingEmergencyContactModalProps) => {
    const [targetEmail, setTargetEmail] = useState('');
    const waitTimeOptions = getWaitTimeOptions();
    const [waitTime, setWaitTime] = useState(getDefaultWaitTimeOptionValue());
    const [emailError, setEmailError] = useState<{ email: string; errorMessage: string } | null>(null);
    const [submitted, setSubmitted] = useState<boolean>(false);
    const dispatch = useDispatch();
    const [asyncError, setAsyncError] = useState<{ email: string; errorMessage: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const handleError = useErrorHandler();
    const { createNotification } = useNotifications();

    const asyncErrorValue = asyncError?.email === targetEmail ? asyncError?.errorMessage : undefined;
    const emailErrorValue = emailError?.email === targetEmail ? emailError.errorMessage : undefined;
    const hasError = Boolean(emailErrorValue || asyncErrorValue);

    return (
        <ModalTwo
            {...rest}
            size="small"
            as="form"
            onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
                if (hasError || loading) {
                    return;
                }
                void (async () => {
                    const payload = {
                        targetEmail,
                        triggerDelay: waitTime / SECOND,
                        types: DelegatedAccessTypeEnum.EmergencyAccess | DelegatedAccessTypeEnum.SocialRecovery,
                    };
                    try {
                        setLoading(true);
                        await dispatch(addDelegatedAccessThunk(payload));
                        createNotification({ text: c('emergency_access').t`Emergency contact added` });
                        rest.onClose?.();
                    } catch (e) {
                        if (e instanceof ValidationError) {
                            setAsyncError({ email: payload.targetEmail, errorMessage: e.message });
                        } else {
                            handleError(e);
                        }
                    } finally {
                        setLoading(false);
                    }
                })();
            }}
        >
            <ModalTwoHeader />
            <ModalTwoContent>
                <div className="mb-6 text-center">
                    <div className="mb-6">
                        <img src={shield} alt="" width={56} height={64} />
                    </div>
                    <h1 className="text-break text-semibold text-2xl mb-1">
                        {c('emergency_access').t`Add emergency contact`}
                    </h1>
                    <div className="color-weak">
                        {c('emergency_access')
                            .t`Choose someone you trust with your data. They must already have a ${BRAND_NAME} Account.`}
                    </div>
                </div>
                <div className="mb-4">
                    <InputFieldTwo
                        as={ContactEmailInput}
                        protonDomains={protonDomains}
                        addresses={addresses}
                        contactEmails={contactEmails}
                        ignoreEmails={existingOutgoingTargetEmails}
                        id="email"
                        label={c('emergency_access').t`${BRAND_NAME} Account email`}
                        value={targetEmail}
                        onValue={(value, errorMessage) => {
                            setTargetEmail(value);
                            if (errorMessage) {
                                setEmailError({ email: value, errorMessage });
                            }
                        }}
                        autoFocus={true}
                        error={submitted ? asyncErrorValue || emailErrorValue : undefined}
                    />
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
                <div>{c('emergency_access').t`You will be notified when someone requests emergency access.`}</div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>
                <Button color="norm" loading={loading} type="submit">{c('emergency_access').t`Add`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
