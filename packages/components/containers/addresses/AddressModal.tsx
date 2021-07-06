import React from 'react';
import { c } from 'ttag';
import { createAddress } from '@proton/shared/lib/api/addresses';
import { ADDRESS_TYPE, MEMBER_PRIVATE } from '@proton/shared/lib/constants';
import { Member, CachedOrganizationKey } from '@proton/shared/lib/interfaces';
import { FormModal, Row, Field, Label, Input, SelectTwo, Option } from '../../components';
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

import useAddressModel from './useAddressModel';
import DomainsSelect from './DomainsSelect';
import CreateMissingKeysAddressModal from './missingKeys/CreateMissingKeysAddressModal';

interface Props {
    onClose?: () => void;
    member?: Member;
    members: Member[];
    organizationKey?: CachedOrganizationKey;
}

const AddressModal = ({ onClose, member, members, organizationKey, ...rest }: Props) => {
    const { createModal } = useModals();
    const { call } = useEventManager();
    const [user, loadingUser] = useUser();
    const [addresses, loadingAddresses] = useAddresses();
    const [premiumDomains, loadingPremiumDomains] = usePremiumDomains();
    const [premiumDomain = ''] = premiumDomains || [];
    const api = useApi();
    const initialMember = member || members[0];
    const { model, update } = useAddressModel(initialMember);
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const hasPremium = addresses.some(({ Type }) => Type === ADDRESS_TYPE.TYPE_PREMIUM);
    const handleChange =
        (key: string) =>
        ({ target }: any) =>
            update(key, target.value);

    const selectedMember = members.find((otherMember) => otherMember.ID === model.id);

    const handleSubmit = async () => {
        if (!selectedMember) {
            throw new Error('Missing member');
        }
        const { name: DisplayName, address: Local, domain: Domain } = model;

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

        onClose?.();
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

    return (
        <FormModal
            title={c('Title').t`Add address`}
            submit={c('Action').t`Save address`}
            cancel={c('Action').t`Cancel`}
            loading={loading || loadingAddresses || loadingPremiumDomains || loadingUser}
            onSubmit={() => withLoading(handleSubmit())}
            onClose={onClose}
            {...rest}
        >
            <Row>
                <Label>{c('Label').t`User`}</Label>
                <Field className="flex-item-fluid-auto pt0-5">
                    {member ? (
                        <strong>{member.Name}</strong>
                    ) : (
                        <SelectTwo value={model.id} onChange={({ value }) => update('id', value)}>
                            {members.map((member) => (
                                <Option value={member.ID} title={member.Name}>
                                    {member.Name}
                                </Option>
                            ))}
                        </SelectTwo>
                    )}
                </Field>
            </Row>
            <Row>
                <Label>{c('Label').t`Address`}</Label>
                <Field className="flex-item-fluid-auto">
                    <div className="flex-autogrid">
                        <div className="flex-autogrid-item pb0">
                            <Input
                                value={model.address}
                                placeholder={c('Placeholder').t`Choose address`}
                                onChange={handleChange('address')}
                                required
                                data-testid="settings:identity-section:add-address:address"
                            />
                        </div>
                        <div className="flex-autogrid-item pb0">
                            <DomainsSelect member={selectedMember || initialMember} onChange={handleChange('domain')} />
                        </div>
                    </div>
                </Field>
            </Row>
            <Row>
                <Label>{c('Label').t`Display name`}</Label>
                <Field className="flex-item-fluid-auto">
                    <Input
                        value={model.name}
                        placeholder={c('Placeholder').t`Choose display name`}
                        onChange={handleChange('name')}
                        data-testid="settings:identity-section:add-address:display-name"
                    />
                </Field>
            </Row>
        </FormModal>
    );
};

export default AddressModal;
