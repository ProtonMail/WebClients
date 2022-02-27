import { FormEvent, useState } from 'react';
import { c } from 'ttag';
import { createAddress } from '@proton/shared/lib/api/addresses';
import {
    ADDRESS_TYPE,
    DEFAULT_ENCRYPTION_CONFIG,
    ENCRYPTION_CONFIGS,
    MEMBER_PRIVATE,
} from '@proton/shared/lib/constants';
import { Member, CachedOrganizationKey } from '@proton/shared/lib/interfaces';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { missingKeysMemberProcess, missingKeysSelfProcess } from '@proton/shared/lib/keys';
import { noop } from '@proton/shared/lib/helpers/function';
import { getAllMemberAddresses } from '@proton/shared/lib/api/members';
import {
    SelectTwo,
    Option,
    ModalProps,
    ModalTwo as Modal,
    ModalTwoFooter as ModalFooter,
    ModalTwoContent as ModalContent,
    ModalTwoHeader as ModalHeader,
    InputFieldTwo,
    Button,
    useFormErrors,
    Loader,
} from '../../components';
import {
    useLoading,
    useNotifications,
    useEventManager,
    useApi,
    useAddresses,
    usePremiumDomains,
    useUser,
    useAuthentication,
    useGetUserKeys,
} from '../../hooks';

import useAddressDomains from './useAddressDomains';
import SelectEncryption from '../keys/addKey/SelectEncryption';

interface Props extends ModalProps<'form'> {
    member?: Member;
    members: Member[];
    organizationKey?: CachedOrganizationKey;
}

const AddressModal = ({ member, members, organizationKey, ...rest }: Props) => {
    const { call } = useEventManager();
    const [user] = useUser();
    const [addresses] = useAddresses();
    const [premiumDomains] = usePremiumDomains();
    const [premiumDomain = ''] = premiumDomains || [];
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
    const hasPremium = addresses.some(({ Type }) => Type === ADDRESS_TYPE.TYPE_PREMIUM);

    const selectedMember = members.find((otherMember) => otherMember.ID === model.id);
    const [addressDomains, loadingDomains] = useAddressDomains(selectedMember || initialMember);
    const domainOptions = addressDomains.map((DomainName) => ({ text: DomainName, value: DomainName }));
    const selectedDomain = model.domain || domainOptions[0]?.text;
    const getUserKeys = useGetUserKeys();

    const shouldGenerateKeys =
        !selectedMember || selectedMember.Self || selectedMember.Private === MEMBER_PRIVATE.READABLE;

    const handleSubmit = async () => {
        if (!selectedMember) {
            throw new Error('Missing member');
        }
        const { name: DisplayName, address: Local } = model;

        const Domain = selectedDomain;

        if (!hasPremium && `${user.Name}@${premiumDomain}`.toLowerCase() === `${Local}@${Domain}`.toLowerCase()) {
            return createNotification({
                text: c('Error')
                    .t`${Local} is your username. To create ${Local}@${Domain}, please go to Settings > Addresses > Short domain (pm.me)`,
                type: 'error',
            });
        }

        const shouldGenerateSelfKeys = selectedMember.Self && selectedMember.Private === MEMBER_PRIVATE.UNREADABLE;
        const shouldGenerateMemberKeys = !shouldGenerateSelfKeys;
        if (shouldGenerateKeys && shouldGenerateMemberKeys && !organizationKey?.privateKey) {
            createNotification({ text: c('Error').t`Organization key is not decrypted`, type: 'error' });
            return;
        }

        const { Address } = await api(
            createAddress({
                MemberID: selectedMember.ID,
                Local,
                Domain,
                DisplayName,
            })
        );

        if (shouldGenerateKeys) {
            if (shouldGenerateSelfKeys) {
                await missingKeysSelfProcess({
                    api,
                    userKeys: await getUserKeys(),
                    addresses,
                    addressesToGenerate: [Address],
                    password: authentication.getPassword(),
                    encryptionConfig: ENCRYPTION_CONFIGS[encryptionType],
                    onUpdate: noop,
                });
            } else {
                if (!organizationKey?.privateKey) {
                    throw new Error('Missing org key');
                }
                await missingKeysMemberProcess({
                    api,
                    encryptionConfig: ENCRYPTION_CONFIGS[encryptionType],
                    ownerAddresses: addresses,
                    memberAddressesToGenerate: [Address],
                    member: selectedMember,
                    memberAddresses: await getAllMemberAddresses(api, selectedMember.ID),
                    onUpdate: noop,
                    organizationKey: organizationKey.privateKey,
                });
            }
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
                <div className="mb1-5">
                    <div className="text-semibold mb0-25">{c('Label').t`User`}</div>
                    {member || members?.length === 1 ? (
                        <div className="text-ellipsis">{member?.Name || members?.[0].Name}</div>
                    ) : (
                        <SelectTwo value={model.id} onChange={({ value }) => setModel({ ...model, id: value })}>
                            {members.map((member) => (
                                <Option value={member.ID} title={member.Name}>
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
                    error={validator([requiredValidator(model.address)])}
                    onValue={(address: string) => setModel({ ...model, address })}
                    label={c('Label').t`Address`}
                    placeholder={c('Placeholder').t`Address`}
                    data-testid="settings:identity-section:add-address:address"
                    suffix={
                        loadingDomains ? (
                            <Loader />
                        ) : domainOptions.length === 1 ? (
                            <span className="text-ellipsis" title={`@${domainOptions[0].value}`}>
                                @{domainOptions[0].value}
                            </span>
                        ) : (
                            <SelectTwo
                                unstyled
                                value={selectedDomain}
                                onChange={({ value }) => setModel({ ...model, domain: value })}
                                data-testid="settings:identity-section:add-address:domain-select"
                            >
                                {domainOptions.map((option) => (
                                    <Option key={option.value} value={option.value} title={option.text}>
                                        @{option.text}
                                    </Option>
                                ))}
                            </SelectTwo>
                        )
                    }
                />
                <InputFieldTwo
                    id="name"
                    value={model.name}
                    onValue={(name: string) => setModel({ ...model, name })}
                    label={c('Label').t`Display name`}
                    placeholder={c('Placeholder').t`Choose display name`}
                    data-testid="settings:identity-section:add-address:display-name"
                />
                {shouldGenerateKeys && (
                    <div className="mb1-5">
                        <div className="text-semibold mb0-25">{c('Label').t`Key strength`}</div>
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
