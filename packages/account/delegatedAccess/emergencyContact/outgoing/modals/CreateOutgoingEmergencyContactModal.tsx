import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwo, { type ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import { useRecoverySettingsTelemetry } from '@proton/components/containers/recovery/recoverySettingsTelemetry';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { BRAND_NAME, SECOND } from '@proton/shared/lib/constants';
import { DelegatedAccessTypeEnum } from '@proton/shared/lib/interfaces/DelegatedAccess';

import ValidationError from '../../../ValidationError';
import { addDelegatedAccessThunk } from '../../../outgoingActions';
import ContactEmailInput from '../../../shared/outgoing/ContactEmailInput';
import { useAddContactInputs } from '../../../shared/outgoing/useAddContactInputs';
import shield from '../../../shared/shield.svg';
import { useDispatch } from '../../../useDispatch';

export interface CreateOutgoingEmergencyContactModalProps extends Omit<
    ModalProps<'form'>,
    'children' | 'buttons' | 'onSubmit'
> {}

export const CreateOutgoingEmergencyContactModal = ({ ...rest }: CreateOutgoingEmergencyContactModalProps) => {
    const { sendRecoverySettingEnabled } = useRecoverySettingsTelemetry();
    const dispatch = useDispatch();
    const [loading, withLoading] = useLoading();
    const handleError = useErrorHandler();
    const { createNotification } = useNotifications();

    const addContactInputs = useAddContactInputs();
    const input = addContactInputs.inputs[0];

    return (
        <ModalTwo
            {...rest}
            size="small"
            as="form"
            onSubmit={(e) => {
                e.preventDefault();
                addContactInputs.setSubmitted(true);
                if (addContactInputs.hasError || loading) {
                    return;
                }
                void withLoading(
                    (async function run() {
                        const payload = {
                            targetEmail: input.email,
                            triggerDelay: input.waitTime / SECOND,
                            types: DelegatedAccessTypeEnum.EmergencyAccess,
                        };
                        try {
                            await dispatch(addDelegatedAccessThunk(payload));
                            createNotification({ text: c('emergency_access').t`Emergency contact added` });
                            if (!addContactInputs.createOutgoingDelegatedAccessData.emergencyContacts.size) {
                                sendRecoverySettingEnabled({ setting: 'emergency_contacts' });
                            }
                            rest.onClose?.();
                        } catch (e) {
                            if (e instanceof ValidationError) {
                                addContactInputs.setAsyncError({ email: e.email, errorMessage: e.message });
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
                        protonDomains={addContactInputs.createOutgoingDelegatedAccessData.domains}
                        addresses={addContactInputs.createOutgoingDelegatedAccessData.addresses}
                        contactEmails={addContactInputs.createOutgoingDelegatedAccessData.contactEmails}
                        ignoreEmails={addContactInputs.createOutgoingDelegatedAccessData.emergencyContacts}
                        id="email"
                        label={c('emergency_access').t`${BRAND_NAME} Account email`}
                        value={input.email}
                        onValue={(value, errorMessage) => {
                            addContactInputs.setInputs(input.id, { email: value, emailError: errorMessage });
                        }}
                        autoFocus={true}
                        error={addContactInputs.submitted ? input.asyncError || input.emailError : undefined}
                    />
                    <InputFieldTwo
                        as={SelectTwo<number>}
                        id="wait-time"
                        label={c('emergency_access').t`Wait time for access`}
                        value={input.waitTime}
                        onValue={(value) => addContactInputs.setInputs(input.id, { waitTime: value })}
                        disabled={loading}
                        assistiveText={c('emergency_access').t`Time required before automatically giving access`}
                    >
                        {addContactInputs.waitTimeOptions.map(({ value, label }) => (
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
