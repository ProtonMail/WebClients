import { FormEvent, useState } from 'react';
import { c } from 'ttag';
import { createAddress } from '@proton/shared/lib/api/addresses';
import { ADDRESS_TYPE, MEMBER_PRIVATE } from '@proton/shared/lib/constants';
import { Member, CachedOrganizationKey } from '@proton/shared/lib/interfaces';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
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
    useModals,
    useApi,
    useAddresses,
    usePremiumDomains,
    useUser,
} from '../../hooks';

import CreateMissingKeysAddressModal from './missingKeys/CreateMissingKeysAddressModal';
import useAddressDomains from './useAddressDomains';

interface Props extends ModalProps<'form'> {
    member?: Member;
    members: Member[];
    organizationKey?: CachedOrganizationKey;
}

const AddressModal = ({ member, members, organizationKey, ...rest }: Props) => {
    const { createModal } = useModals();
    const { call } = useEventManager();
    const [user] = useUser();
    const [addresses] = useAddresses();
    const [premiumDomains] = usePremiumDomains();
    const [premiumDomain = ''] = premiumDomains || [];
    const api = useApi();
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
    const { validator, onFormSubmit } = useFormErrors();
    const [submitting, withLoading] = useLoading();
    const hasPremium = addresses.some(({ Type }) => Type === ADDRESS_TYPE.TYPE_PREMIUM);

    const selectedMember = members.find((otherMember) => otherMember.ID === model.id);
    const [addressDomains, loadingDomains] = useAddressDomains(selectedMember || initialMember);
    const domainOptions = addressDomains.map((DomainName) => ({ text: DomainName, value: DomainName }));
    const selectedDomain = model.domain || domainOptions[0]?.text;

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

        const { Address } = await api(
            createAddress({
                MemberID: selectedMember.ID,
                Local,
                Domain,
                DisplayName,
            })
        );

        await call();

        rest.onClose?.();
        createNotification({ text: c('Success').t`Address added` });

        if (selectedMember.Self || selectedMember.Private === MEMBER_PRIVATE.READABLE) {
            createModal(
                <CreateMissingKeysAddressModal
                    organizationKey={organizationKey}
                    member={selectedMember}
                    addressesToGenerate={[Address]}
                />
            );
        }
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
            </ModalContent>
            <ModalFooter>
                <Button onClick={handleClose} disabled={submitting}>{c('Action').t`Cancel`}</Button>
                <Button color="norm" type="submit" loading={submitting}>{c('Action').t`Save address`}</Button>
            </ModalFooter>
        </Modal>
    );
};

export default AddressModal;
