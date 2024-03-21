import { FormEvent, useState } from 'react';

import { c } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms';
import { useLoading } from '@proton/hooks';
import { createAddress } from '@proton/shared/lib/api/addresses';
import { getAllMemberAddresses } from '@proton/shared/lib/api/members';
import {
    ADDRESS_TYPE,
    DEFAULT_ENCRYPTION_CONFIG,
    ENCRYPTION_CONFIGS,
    MEMBER_PRIVATE,
} from '@proton/shared/lib/constants';
import { getAvailableAddressDomains } from '@proton/shared/lib/helpers/address';
import { getEmailParts } from '@proton/shared/lib/helpers/email';
import {
    confirmPasswordValidator,
    emailValidator,
    passwordLengthValidator,
    requiredValidator,
} from '@proton/shared/lib/helpers/formValidators';
import { Address, MEMBER_STATE, Member } from '@proton/shared/lib/interfaces';
import {
    getCanGenerateMemberKeys,
    getShouldSetupMemberKeys,
    missingKeysMemberProcess,
    missingKeysSelfProcess,
    setupMemberKeys,
} from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import {
    DropdownSizeUnit,
    InputFieldTwo,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    ModalProps,
    Option,
    PasswordInputTwo,
    SelectTwo,
    useFormErrors,
} from '../../components';
import {
    useAddresses,
    useApi,
    useAuthentication,
    useCustomDomains,
    useEventManager,
    useGetOrganizationKey,
    useGetUserKeys,
    useNotifications,
    useProtonDomains,
    useUser,
} from '../../hooks';
import { useKTVerifier } from '../keyTransparency';
import SelectEncryption from '../keys/addKey/SelectEncryption';

interface Props extends ModalProps<'form'> {
    member?: Member;
    members: Member[];
    useEmail?: boolean;
}

const AddressModal = ({ member, members, useEmail, ...rest }: Props) => {
    const { call } = useEventManager();
    const [user] = useUser();
    const [addresses] = useAddresses();
    const [customDomains, loadingCustomDomains] = useCustomDomains();
    const [{ premiumDomains, protonDomains }, loadingProtonDomains] = useProtonDomains();
    const loadingDomains = loadingCustomDomains || loadingProtonDomains;
    const [premiumDomain = ''] = premiumDomains;
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const api = useApi();
    const initialMember = member || members[0];
    const [encryptionType, setEncryptionType] = useState(DEFAULT_ENCRYPTION_CONFIG);
    const authentication = useAuthentication();
    const [model, setModel] = useState(() => {
        return {
            id: initialMember.ID,
            name: '',
            address: '',
            domain: '',
        };
    });
    const { createNotification } = useNotifications();
    const { validator, onFormSubmit } = useFormErrors();
    const [submitting, withLoading] = useLoading();
    const hasPremium = addresses?.some(({ Type }) => Type === ADDRESS_TYPE.TYPE_PREMIUM);
    const getOrganizationKey = useGetOrganizationKey();

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
    const getUserKeys = useGetUserKeys();
    const { keyTransparencyVerify, keyTransparencyCommit } = useKTVerifier(api, async () => user);

    const shouldGenerateKeys =
        !selectedMember || Boolean(selectedMember.Self) || getCanGenerateMemberKeys(selectedMember);

    const shouldSetupMemberKeys = shouldGenerateKeys && getShouldSetupMemberKeys(selectedMember);

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
        if (!selectedMember || !addresses) {
            throw new Error('Missing member');
        }
        const organizationKey = await getOrganizationKey();
        const DisplayName = model.name;

        if (!hasPremium && `${user.Name}@${premiumDomain}`.toLowerCase() === emailAddress.toLowerCase()) {
            return createNotification({
                text: c('Error')
                    .t`${user.Name} is your username. To create ${emailAddress}, please go to Settings > Messages and composing > Short domain (pm.me)`,
                type: 'error',
            });
        }

        const shouldGenerateSelfKeys =
            Boolean(selectedMember.Self) && selectedMember.Private === MEMBER_PRIVATE.UNREADABLE;
        const shouldGenerateMemberKeys = !shouldGenerateSelfKeys;
        if (shouldGenerateKeys && shouldGenerateMemberKeys && !organizationKey?.privateKey) {
            createNotification({ text: c('Error').t`Organization key is not decrypted`, type: 'error' });
            return;
        }

        const { Address } = await api<{ Address: Address }>(
            createAddress({
                MemberID: selectedMember.ID,
                Local: emailAddressParts.Local,
                Domain: emailAddressParts.Domain,
                DisplayName,
            })
        );

        const encryptionConfig = ENCRYPTION_CONFIGS[encryptionType];

        if (shouldGenerateKeys) {
            const userKeys = await getUserKeys();

            if (shouldGenerateSelfKeys) {
                await missingKeysSelfProcess({
                    api,
                    userKeys,
                    addresses,
                    addressesToGenerate: [Address],
                    password: authentication.getPassword(),
                    encryptionConfig,
                    onUpdate: noop,
                    keyTransparencyVerify,
                });
            } else {
                if (!organizationKey?.privateKey) {
                    throw new Error('Missing org key');
                }
                const memberAddresses = await getAllMemberAddresses(api, selectedMember.ID);
                if (shouldSetupMemberKeys && password) {
                    await setupMemberKeys({
                        ownerAddresses: addresses,
                        encryptionConfig,
                        organizationKey: organizationKey.privateKey,
                        member: selectedMember,
                        memberAddresses,
                        password,
                        api,
                        keyTransparencyVerify,
                    });
                } else {
                    await missingKeysMemberProcess({
                        api,
                        encryptionConfig,
                        ownerAddresses: addresses,
                        memberAddressesToGenerate: [Address],
                        member: selectedMember,
                        memberAddresses,
                        onUpdate: noop,
                        organizationKey: organizationKey.privateKey,
                        keyTransparencyVerify,
                    });
                }
            }

            await keyTransparencyCommit(userKeys);
        }

        await call();

        rest.onClose?.();
        createNotification({ text: c('Success').t`Address added` });
    };

    const handleClose = submitting ? undefined : rest.onClose;

    return (
        <Modal
            as="form"
            {...rest}
            onSubmit={(event: FormEvent) => {
                event.preventDefault();
                event.stopPropagation();
                if (!onFormSubmit()) {
                    return;
                }
                withLoading(handleSubmit());
            }}
            onClose={handleClose}
        >
            <ModalHeader title={c('Title').t`Add address`} />
            <ModalContent>
                <div className="mb-6">
                    <div className="text-semibold mb-1" id="label-user-select">{c('Label').t`User`}</div>
                    {member || members?.length === 1 ? (
                        <div className="text-ellipsis">{member?.Name || members?.[0].Name}</div>
                    ) : (
                        <SelectTwo
                            aria-describedby="label-user-select"
                            value={model.id}
                            onChange={({ value }) => setModel({ ...model, id: value })}
                        >
                            {members.map((member) => (
                                <Option
                                    value={member.ID}
                                    title={member.Name}
                                    disabled={
                                        member.State === MEMBER_STATE.STATUS_DISABLED ||
                                        member.State === MEMBER_STATE.STATUS_INVITED
                                    }
                                >
                                    {member.Name}
                                </Option>
                            ))}
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
                        <InputFieldTwo
                            required
                            id="password"
                            as={PasswordInputTwo}
                            value={password}
                            error={validator([passwordLengthValidator(password), requiredValidator(password)])}
                            onValue={setPassword}
                            label={c('Label').t`Password`}
                            placeholder={c('Placeholder').t`Password`}
                            autoComplete="new-password"
                        />
                        <InputFieldTwo
                            id="confirmPassword"
                            as={PasswordInputTwo}
                            label={c('Label').t`Confirm password`}
                            placeholder={c('Placeholder').t`Confirm`}
                            value={confirmPassword}
                            onValue={setConfirmPassword}
                            error={validator([
                                passwordLengthValidator(confirmPassword),
                                confirmPasswordValidator(confirmPassword, password),
                            ])}
                            autoComplete="new-password"
                        />
                    </>
                )}
                {!useEmail && shouldGenerateKeys && (
                    <div className="mb-6">
                        <div className="text-semibold mb-1">{c('Label').t`Key strength`}</div>
                        <SelectEncryption encryptionType={encryptionType} setEncryptionType={setEncryptionType} />
                    </div>
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
