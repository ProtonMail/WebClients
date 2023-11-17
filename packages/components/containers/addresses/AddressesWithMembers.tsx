import { useMemo, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button, Href } from '@proton/atoms';
import { ALL_MEMBERS_ID, BRAND_NAME, MEMBER_PRIVATE } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { Member, Organization, UserModel } from '@proton/shared/lib/interfaces';

import { Alert, Loader, SettingsLink, useModalState } from '../../components';
import { useAddresses, useMemberAddresses, useMembers, useNotifications, useOrganizationKey } from '../../hooks';
import { SettingsParagraph } from '../account';
import AddressModal from './AddressModal';
import AddressesTable from './AddressesTable';
import AddressesWithUser from './AddressesWithUser';

const getMemberIndex = (members: Member[] = [], memberID?: string, isOnlySelf?: boolean) => {
    const newMemberIndex =
        memberID && !isOnlySelf
            ? members.findIndex(({ ID }) => ID === memberID)
            : members.findIndex(({ Self }) => Self);
    if (newMemberIndex === -1 && members.length) {
        return 0;
    }
    return newMemberIndex;
};

interface Props {
    user: UserModel;
    organization: Organization;
    isOnlySelf?: boolean;
    memberID?: string;
}

const AddressesWithMembers = ({ user, organization, memberID, isOnlySelf }: Props) => {
    const [members, loadingMembers] = useMembers();
    const [addresses, loadingAddresses] = useAddresses();
    const [organizationKey, loadingOrganizationKey] = useOrganizationKey(organization);
    const [addressModalProps, setAddressModalOpen, renderAddressModal] = useModalState();
    const { createNotification } = useNotifications();
    const [tmpMember, setTmpMember] = useState<Member | null>(null);

    const hasAddresses = Array.isArray(addresses) && addresses.length > 0;

    const { UsedAddresses: OrganizationUsedAddresses, MaxAddresses: OrganizationMaxAddresses } = organization || {};
    const UsedAddresses = hasAddresses ? OrganizationUsedAddresses || 1 : 0;
    const MaxAddresses = OrganizationMaxAddresses || 1;

    const memberIndex = useMemo(() => {
        if (Array.isArray(members)) {
            return getMemberIndex(members, memberID, isOnlySelf);
        }

        return -1;
    }, [members, memberID]);

    const selectedMembers = useMemo(() => {
        if (memberIndex === ALL_MEMBERS_ID) {
            return members;
        }
        if (members && memberIndex in members) {
            return [members[memberIndex]];
        }
        return [];
    }, [members, memberIndex]);

    const [memberAddressesMap, loadingMemberAddresses] = useMemberAddresses(selectedMembers);

    const hasUsernameDisplay = memberIndex === ALL_MEMBERS_ID;
    const isSelfSelected = useMemo(() => {
        if (!members) {
            return false;
        }
        return memberIndex === members.findIndex(({ Self }) => Self);
    }, [memberIndex, members]);

    const handleAddAddress = (member: Member) => {
        if (member.Private === MEMBER_PRIVATE.READABLE && !organizationKey?.privateKey) {
            createNotification({ type: 'error', text: c('Error').t`The organization key must be activated first` });
            throw new Error('Organization key is not decrypted');
        }
        setTmpMember(member);
        setAddressModalOpen(true);
    };

    const currentMember = members?.[memberIndex];

    const mustActivateOrganizationKey =
        currentMember?.Private === MEMBER_PRIVATE.READABLE && !organizationKey?.privateKey;

    const activateLink = (
        <SettingsLink path="/organization-keys" key="activate">{c('Action').t`activate`}</SettingsLink>
    );

    const children = (
        <>
            <SettingsParagraph className="mt-2">
                <span>
                    {c('Info').t`Use the different types of email addresses and aliases offered by ${BRAND_NAME}.`}
                </span>
                <br />
                <Href href={getKnowledgeBaseUrl('/addresses-and-aliases')}>{c('Link').t`Learn more`}</Href>
            </SettingsParagraph>

            {currentMember && !user.isSubUser && (
                <div className="mb-4 flex gap-2 flex-align-self-start items-center">
                    <div className="mr-4">
                        {mustActivateOrganizationKey ? (
                            <Alert className="mb-4" type="warning">
                                {c('Warning')
                                    .jt`You must ${activateLink} organization keys before adding an email address to a non-private member.`}
                            </Alert>
                        ) : (
                            <Button
                                shape="outline"
                                onClick={() => handleAddAddress(currentMember)}
                                data-testid="settings:identity-section:add-address"
                            >
                                {c('Action').t`Add address`}
                            </Button>
                        )}
                    </div>
                    <div>
                        {c('Label').ngettext(
                            msgid`${UsedAddresses} of ${MaxAddresses} email address`,
                            `${UsedAddresses} of ${MaxAddresses} email addresses`,
                            MaxAddresses
                        )}
                    </div>
                </div>
            )}

            {isSelfSelected ? (
                <AddressesWithUser
                    user={user}
                    member={currentMember}
                    organizationKey={organizationKey}
                    hasDescription={false}
                />
            ) : (
                <AddressesTable
                    hasUsername={hasUsernameDisplay}
                    loading={selectedMembers.some(({ ID }) => !Array.isArray(memberAddressesMap?.[ID]))}
                    user={user}
                    members={selectedMembers}
                    memberAddresses={memberAddressesMap}
                    organizationKey={loadingOrganizationKey ? undefined : organizationKey}
                />
            )}
        </>
    );

    const loading =
        loadingMembers || loadingAddresses || memberIndex === -1 || (loadingMemberAddresses && !memberAddressesMap);

    return (
        <>
            {renderAddressModal && tmpMember && (
                <AddressModal
                    member={tmpMember}
                    members={members}
                    organizationKey={organizationKey}
                    {...addressModalProps}
                />
            )}
            {loading ? <Loader /> : children}
        </>
    );
};

export default AddressesWithMembers;
