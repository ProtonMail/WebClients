import type { FormEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { createAddress } from '@proton/account/addresses/actions';
import { useCustomDomains } from '@proton/account/domains/hooks';
import { usePasswordPolicies } from '@proton/account/passwordPolicies/hooks';
import { useProtonDomains } from '@proton/account/protonDomains/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import Option from '@proton/components/components/option/Option';
import { usePasswordPolicyValidation } from '@proton/components/components/passwordPolicy';
import PasswordWithPolicyInputs from '@proton/components/components/passwordPolicy/PasswordWithPolicyInputs';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import { getAvailableAddressDomains } from '@proton/shared/lib/helpers/address';
import { getEmailParts } from '@proton/shared/lib/helpers/email';
import { emailValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import type { Member } from '@proton/shared/lib/interfaces';
import { getCanGenerateMemberKeys, getShouldSetupMemberKeys } from '@proton/shared/lib/keys';
import { getIsMemberDisabled, getIsMemberInvited } from '@proton/shared/lib/keys/memberHelper';

interface Props extends ModalProps<'form'> {
    member?: Member;
    members: Member[];
    useEmail?: boolean;
}

const AddressModal = ({ member, members, useEmail, ...rest }: Props) => {
    const [user] = useUser();
    const [customDomains, loadingCustomDomains] = useCustomDomains();
    const [{ premiumDomains, protonDomains }, loadingProtonDomains] = useProtonDomains();
    const loadingDomains = loadingCustomDomains || loadingProtonDomains;
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const initialMember = member || members[0];
    const [model, setModel] = useState(() => {
        return {
            id: initialMember.ID,
            name: '',
            address: '',
            domain: '',
        };
    });
    const { createNotification } = useNotifications();
    const formErrors = useFormErrors();
    const { validator, onFormSubmit } = formErrors;
    const [submitting, withLoading] = useLoading();
    const errorHandler = useErrorHandler();
    const dispatch = useDispatch();

    const selectedMember = members.find((otherMember) => otherMember.ID === model.id);
    const addressDomains = getAvailableAddressDomains({
        member: selectedMember || initialMember,
        user,
        protonDomains,
        premiumDomains,
        customDomains,
    });
    const domainOptions = addressDomains.map((DomainName) => ({ text: DomainName, value: DomainName }));
    const selectedDomain = model.domain || domainOptions[0]?.text;

    const shouldGenerateKeys =
        !selectedMember || Boolean(selectedMember.Self) || getCanGenerateMemberKeys(selectedMember);

    const shouldSetupMemberKeys = shouldGenerateKeys && getShouldSetupMemberKeys(selectedMember);
    const passwordPolicyValidation = usePasswordPolicyValidation(password, usePasswordPolicies());
    const passwordPolicyError = shouldSetupMemberKeys && !passwordPolicyValidation.valid;

    const getNormalizedAddress = () => {
        const address = model.address.trim();

        if (selectedDomain && !useEmail) {
            return { Local: address, Domain: selectedDomain };
        }

        const [Local, Domain] = getEmailParts(address);

        return { Local, Domain };
    };

    const emailAddressParts = getNormalizedAddress();
    const emailAddress = `${emailAddressParts.Local}@${emailAddressParts.Domain}`;

    const handleSubmit = async () => {
        if (!selectedMember) {
            throw new Error('Missing member');
        }

        await dispatch(
            createAddress({
                member: selectedMember,
                emailAddressParts,
                displayName: model.name,
                password,
            })
        );

        rest.onClose?.();
        createNotification({ text: c('Success').t`Address added` });
    };

    const handleClose = submitting ? undefined : rest.onClose;

    const getMemberName = (member: Member | undefined) => {
        return (member?.Self && user.Name ? user.Name : member?.Name) || '';
    };

    return (
        <Modal
            as="form"
            {...rest}
            onSubmit={(event: FormEvent) => {
                event.preventDefault();
                event.stopPropagation();
                if (!onFormSubmit() || passwordPolicyError) {
                    return;
                }
                withLoading(handleSubmit()).catch(errorHandler);
            }}
            onClose={handleClose}
        >
            <ModalHeader title={c('Title').t`Add address`} />
            <ModalContent>
                <div className="mb-6">
                    <div className="text-semibold mb-1" id="label-user-select">{c('Label').t`User`}</div>
                    {member || members?.length === 1 ? (
                        <div className="text-ellipsis">{getMemberName(selectedMember)}</div>
                    ) : (
                        <SelectTwo
                            aria-describedby="label-user-select"
                            value={model.id}
                            onChange={({ value }) => setModel({ ...model, id: value })}
                        >
                            {members.map((member) => {
                                const name = getMemberName(member);
                                return (
                                    <Option
                                        key={member.ID}
                                        value={member.ID}
                                        title={name}
                                        disabled={getIsMemberDisabled(member) || getIsMemberInvited(member)}
                                    >
                                        {name}
                                    </Option>
                                );
                            })}
                        </SelectTwo>
                    )}
                </div>

                <InputFieldTwo
                    id="address"
                    autoFocus
                    value={model.address}
                    error={validator([requiredValidator(model.address), emailValidator(emailAddress)])}
                    aria-describedby="user-domain-selected"
                    onValue={(address: string) => setModel({ ...model, address })}
                    label={useEmail ? c('Label').t`Email` : c('Label').t`Address`}
                    placeholder={c('Placeholder').t`Address`}
                    data-testid="settings:identity-section:add-address:address"
                    suffix={(() => {
                        if (useEmail) {
                            return null;
                        }
                        if (loadingDomains) {
                            return <CircleLoader />;
                        }
                        if (domainOptions.length === 0) {
                            return null;
                        }
                        if (domainOptions.length === 1) {
                            return (
                                <span
                                    className="text-ellipsis"
                                    id="user-domain-selected"
                                    title={`@${domainOptions[0].value}`}
                                >
                                    @{domainOptions[0].value}
                                </span>
                            );
                        }
                        return (
                            <SelectTwo
                                unstyled
                                size={{ width: DropdownSizeUnit.Static }}
                                originalPlacement="bottom-end"
                                value={selectedDomain}
                                onChange={({ value }) => setModel({ ...model, domain: value })}
                                data-testid="settings:identity-section:add-address:domain-select"
                                id="user-domain-selected"
                            >
                                {domainOptions.map((option) => (
                                    <Option key={option.value} value={option.value} title={`@${option.text}`}>
                                        @{option.text}
                                    </Option>
                                ))}
                            </SelectTwo>
                        );
                    })()}
                />
                {!useEmail && (
                    <InputFieldTwo
                        id="name"
                        value={model.name}
                        onValue={(name: string) => setModel({ ...model, name })}
                        label={c('Label').t`Display name`}
                        placeholder={c('Placeholder').t`Choose display name`}
                        data-testid="settings:identity-section:add-address:display-name"
                    />
                )}
                {shouldSetupMemberKeys && (
                    <>
                        <div className="mb-4 color-weak">
                            {c('Info')
                                .t`Before creating this address you need to provide a password and create encryption keys for it.`}
                        </div>
                        <PasswordWithPolicyInputs
                            loading={submitting}
                            passwordPolicyValidation={passwordPolicyValidation}
                            passwordState={[password, setPassword]}
                            confirmPasswordState={[confirmPassword, setConfirmPassword]}
                            formErrors={formErrors}
                            formLabels={{
                                password: c('Label').t`Password`,
                                confirmPassword: c('Label').t`Confirm password`,
                            }}
                            isAboveModal={true}
                        />
                    </>
                )}
            </ModalContent>
            <ModalFooter>
                <Button onClick={handleClose} disabled={submitting}>{c('Action').t`Cancel`}</Button>
                <Button color="norm" type="submit" loading={submitting}>{c('Action').t`Save address`}</Button>
            </ModalFooter>
        </Modal>
    );
};

export default AddressModal;
