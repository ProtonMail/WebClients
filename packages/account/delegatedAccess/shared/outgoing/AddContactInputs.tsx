import { c } from 'ttag';

import InputFieldStacked from '@proton/components/components/inputFieldStacked/InputFieldStacked';
import InputFieldStackedGroup from '@proton/components/components/inputFieldStacked/InputFieldStackedGroup';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import type useFormErrors from '@proton/components/components/v2/useFormErrors';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import ContactEmailInput from './ContactEmailInput';
import type { useAddContactInputs } from './useAddContactInputs';

export const AddContactInputs = ({
    type,
    addContactInputs,
    loading,
    validator,
    hasMore = false,
}: {
    type: 'emergencyContacts' | 'recoveryContacts';
    addContactInputs: ReturnType<typeof useAddContactInputs>;
    loading: boolean;
    validator: ReturnType<typeof useFormErrors>['validator'];
    hasMore?: boolean;
}) => {
    return (
        <InputFieldStackedGroup>
            {addContactInputs.inputs.map((input, index, arr) => {
                const shouldValidateError = index === 0 || !!input.email;
                const error =
                    addContactInputs.submitted && shouldValidateError
                        ? input.asyncError || input.emailError
                        : undefined;

                return (
                    <InputFieldStacked
                        key={input.id}
                        isGroupElement
                        icon="user"
                        suffix={
                            type === 'emergencyContacts' ? (
                                <InputFieldTwo
                                    as={SelectTwo<number>}
                                    id="wait-time"
                                    value={input.waitTime}
                                    onValue={(waitTime) =>
                                        addContactInputs.setInputs(input.id, {
                                            waitTime,
                                        })
                                    }
                                    disabled={loading}
                                    unstyled
                                >
                                    {addContactInputs.waitTimeOptions.map(({ value, label }) => (
                                        <Option key={value} value={value} title={label} />
                                    ))}
                                </InputFieldTwo>
                            ) : undefined
                        }
                    >
                        <InputFieldTwo
                            unstyled
                            inputClassName="rounded-none"
                            placeholder="name@example.com"
                            as={ContactEmailInput}
                            protonDomains={addContactInputs.createOutgoingDelegatedAccessData.domains}
                            addresses={addContactInputs.createOutgoingDelegatedAccessData.addresses}
                            contactEmails={addContactInputs.createOutgoingDelegatedAccessData.contactEmails}
                            ignoreEmails={addContactInputs.createOutgoingDelegatedAccessData[type]}
                            id="email"
                            value={input.email}
                            onValue={(value, errorMessage) => {
                                if (loading) {
                                    return;
                                }
                                addContactInputs.setInputs(input.id, {
                                    email: value,
                                    emailError: errorMessage,
                                });
                            }}
                            autoFocus={index === arr.length - 1 ? true : undefined}
                            error={validator(index === 0 ? [requiredValidator(input.email)] : []) || error}
                        />
                    </InputFieldStacked>
                );
            })}

            {hasMore && (
                <InputFieldStacked isGroupElement icon="plus">
                    <button
                        className="text-left w-full outline-none--at-all"
                        type="button"
                        onClick={() => {
                            addContactInputs.addInput();
                        }}
                    >
                        {c('emergency_access').t`Add 1 more`}
                    </button>
                </InputFieldStacked>
            )}
        </InputFieldStackedGroup>
    );
};
