import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwo, { type ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useLoading from '@proton/hooks/useLoading';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import ValidationError from '../../../ValidationError';
import { DelegatedAccessTypeEnum, type OutgoingDelegatedAccessOutput } from '../../../interface';
import { addDelegatedAccessThunk } from '../../../outgoingActions';
import ContactEmailInput, { type ContactEmailInputProps } from '../../../shared/outgoing/ContactEmailInput';
import shieldSuccess from '../../../shared/shield-success.svg';
import shield from '../../../shared/shield.svg';
import { useDispatch } from '../../../useDispatch';

export interface AddOutgoingTrustedContactModalProps extends Omit<
    ModalProps<'form'>,
    'children' | 'buttons' | 'onSubmit'
> {
    existingOutgoingTargetEmails: Set<string>;
    contactEmails: ContactEmailInputProps['contactEmails'];
    addresses: ContactEmailInputProps['addresses'];
    protonDomains: ContactEmailInputProps['protonDomains'];
    email: string;
}

const getHeader = (text: string, email: string, svg = shield) => {
    return (
        <div className="mb-6 text-center">
            <div className="mb-6">
                <img src={svg} alt="" width={56} height={64} />
            </div>
            <h1 className="text-break text-semibold text-2xl mb-1">{text}</h1>
            <div className="color-weak">{c('emergency_access').t`For ${email}`}</div>
        </div>
    );
};

export const CreateOutgoingRecoveryContactModal = ({
    protonDomains,
    addresses,
    existingOutgoingTargetEmails,
    contactEmails,
    email,
    ...rest
}: AddOutgoingTrustedContactModalProps) => {
    const [targetEmail, setTargetEmail] = useState('');
    const [emailError, setEmailError] = useState<{ email: string; errorMessage: string } | null>(null);
    const [submitted, setSubmitted] = useState<boolean>(false);
    const dispatch = useDispatch();
    const [asyncError, setAsyncError] = useState<{ email: string; errorMessage: string } | null>(null);
    const [loading, withLoading] = useLoading();
    const handleError = useErrorHandler();
    const [delegatedAccess, setDelegatedAccess] = useState<OutgoingDelegatedAccessOutput | null>(null);

    const asyncErrorValue = asyncError?.email === targetEmail ? asyncError?.errorMessage : undefined;
    const emailErrorValue = emailError?.email === targetEmail ? emailError.errorMessage : undefined;
    const hasError = Boolean(emailErrorValue || asyncErrorValue);

    if (delegatedAccess) {
        const contact = delegatedAccess.TargetEmail;
        return (
            <ModalTwo {...rest} size="small">
                <ModalTwoHeader />
                <ModalTwoContent>
                    {getHeader(c('emergency_access').t`Recovery contact added`, email, shieldSuccess)}
                    <div className="mb-4">
                        {getBoldFormattedText(
                            c('emergency_access')
                                .t`**${contact}** is now your recovery contact. They can help you recover your data after a password reset.`
                        )}
                    </div>
                </ModalTwoContent>
                <ModalTwoFooter>
                    <Button onClick={rest.onClose} color="norm" loading={loading} type="submit" fullWidth>
                        {c('emergency_access').t`Got it`}
                    </Button>
                </ModalTwoFooter>
            </ModalTwo>
        );
    }

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
                void withLoading(
                    (async function run() {
                        const payload = {
                            targetEmail,
                            triggerDelay: 0,
                            types: DelegatedAccessTypeEnum.SocialRecovery,
                        };
                        try {
                            const delegatedAccess = await dispatch(addDelegatedAccessThunk(payload));
                            setDelegatedAccess(delegatedAccess);
                        } catch (e) {
                            if (e instanceof ValidationError) {
                                setAsyncError({ email: payload.targetEmail, errorMessage: e.message });
                            } else {
                                handleError(e);
                            }
                        }
                    })()
                );
            }}
        >
            <ModalTwoHeader />
            <ModalTwoContent>
                {getHeader(c('emergency_access').t`Add recovery contact`, email)}
                <div className="mb-4">
                    {c('emergency_access')
                        .t`Choose someone you trust to help you recover your data in case of password reset. Recovery contacts must already have a ${BRAND_NAME} Account.`}
                </div>
                <div>
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
                </div>
                <div className="text-sm flex flex-nowrap gap-2">
                    <span className="shrink-0 inline-flex">
                        <IcInfoCircle />
                    </span>
                    <span>
                        {c('emergency_access')
                            .t`Your recovery contacts should be people you know and can contact easily.`}
                    </span>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>
                <Button color="norm" loading={loading} type="submit">{c('emergency_access').t`Add`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
