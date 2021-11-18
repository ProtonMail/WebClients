import { useMemo } from 'react';
import { ALL_MEMBERS_ID, MEMBER_PRIVATE } from '@proton/shared/lib/constants';
import { c, msgid } from 'ttag';
import { UserModel, Organization, Member } from '@proton/shared/lib/interfaces';

import { Alert, Loader, Button, SettingsLink } from '../../components';
import {
    useMembers,
    useMemberAddresses,
    useModals,
    useOrganizationKey,
    useNotifications,
    useAddresses,
} from '../../hooks';

import { SettingsParagraph } from '../account';

import AddressModal from './AddressModal';
import AddressesWithUser from './AddressesWithUser';
import AddressesTable from './AddressesTable';

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
    const { createModal } = useModals();
    const [members, loadingMembers] = useMembers();
    const [memberAddressesMap, loadingMemberAddresses] = useMemberAddresses(members);
    const [addresses, loadingAddresses] = useAddresses();
    const [organizationKey, loadingOrganizationKey] = useOrganizationKey(organization);
    const { createNotification } = useNotifications();

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

    const hasUsernameDisplay = memberIndex === ALL_MEMBERS_ID;
    const isSelfSelected = useMemo(() => {
        if (!members) {
            return false;
        }
        return memberIndex === members.findIndex(({ Self }) => Self);
    }, [memberIndex, members]);

    if (loadingMembers || loadingAddresses || memberIndex === -1 || (loadingMemberAddresses && !memberAddressesMap)) {
        return <Loader />;
    }

    const handleAddAddress = (member: Member) => {
        if (member.Private === MEMBER_PRIVATE.READABLE && !organizationKey?.privateKey) {
            createNotification({ type: 'error', text: c('Error').t`The organization key must be activated first` });
            throw new Error('Organization key is not decrypted');
        }
        createModal(<AddressModal member={member} members={members} organizationKey={organizationKey} />);
    };

    const currentMember = members?.[memberIndex];

    const mustActivateOrganizationKey =
        currentMember?.Private === MEMBER_PRIVATE.READABLE && !organizationKey?.privateKey;

    const activateLink = <SettingsLink path="/organization-keys">{c('Action').t`activate`}</SettingsLink>;

    return (
        <>
            <SettingsParagraph className="mt0-5">
                {c('Info')
                    .t`The email address you place at the top of the list is your default email address. Drag and drop to reorder your addresses.`}
            </SettingsParagraph>

            {currentMember && (
                <div className="mb1 flex flex-align-self-start flex-align-items-center">
                    <div className="mr1">
                        {mustActivateOrganizationKey ? (
                            <Alert className="mb1" type="warning">
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
                <AddressesWithUser user={user} member={currentMember} organizationKey={organizationKey} />
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
};

export default AddressesWithMembers;
