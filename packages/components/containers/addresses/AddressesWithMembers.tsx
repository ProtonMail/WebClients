import { useMemo, useState } from 'react';

import { c, msgid } from 'ttag';

import { useMemberAddresses } from '@proton/account';
import { getDomainAddressError } from '@proton/account/members/validateAddUser';
import { Button, Href } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import Loader from '@proton/components/components/loader/Loader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import GenericError from '@proton/components/containers/error/GenericError';
import { ALL_MEMBERS_ID, BRAND_NAME, MEMBER_PRIVATE } from '@proton/shared/lib/constants';
import { getAvailableAddressDomains } from '@proton/shared/lib/helpers/address';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Member, Organization, UserModel } from '@proton/shared/lib/interfaces';
import { getOrganizationKeyInfo, validateOrganizationKey } from '@proton/shared/lib/organization/helper';

import {
    useAddresses,
    useCustomDomains,
    useMembers,
    useNotifications,
    useOrganizationKey,
    useProtonDomains,
} from '../../hooks';
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
    organization?: Organization;
    isOnlySelf?: boolean;
    memberID?: string;
    allowAddressDeletion: boolean;
    hasDescription?: boolean;
}

const AddressesWithMembers = ({
    user,
    organization,
    memberID,
    isOnlySelf,
    allowAddressDeletion,
    hasDescription = true,
}: Props) => {
    const [members, loadingMembers] = useMembers();
    const [addresses, loadingAddresses] = useAddresses();
    const [customDomains] = useCustomDomains();
    const [{ premiumDomains, protonDomains }] = useProtonDomains();
    const [organizationKey] = useOrganizationKey();
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
        if (members && memberIndex === ALL_MEMBERS_ID) {
            return members;
        }
        if (members && memberIndex in members) {
            return [members[memberIndex]];
        }
        return [];
    }, [members, memberIndex]);

    const { value: memberAddressesMap, retry } = useMemberAddresses({
        members: selectedMembers,
        partial: false,
    });

    const hasUsernameDisplay = memberIndex === ALL_MEMBERS_ID;
    const isSelfSelected = useMemo(() => {
        if (!members) {
            return false;
        }
        return memberIndex === members.findIndex(({ Self }) => Self);
    }, [memberIndex, members]);

    const handleAddAddress = (member: Member) => {
        if (member.Private === MEMBER_PRIVATE.READABLE) {
            const orgKeyError = validateOrganizationKey(
                getOrganizationKeyInfo(organization, organizationKey, addresses)
            );
            if (orgKeyError) {
                createNotification({ type: 'error', text: orgKeyError });
                return;
            }
        }
        const domains = getAvailableAddressDomains({
            member,
            user,
            premiumDomains,
            customDomains,
            protonDomains,
        });
        if (!domains.length) {
            createNotification({ type: 'error', text: getDomainAddressError() });
            return;
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

    const membersWithError = selectedMembers.filter((member) => {
        return member.addressState === 'rejected';
    });

    const children = (
        <>
            {hasDescription && (
                <SettingsParagraph className="mt-2">
                    <span>
                        {c('Info').t`Use the different types of email addresses and aliases offered by ${BRAND_NAME}.`}
                    </span>
                    <br />
                    <Href href={getKnowledgeBaseUrl('/addresses-and-aliases')}>{c('Link').t`Learn more`}</Href>
                </SettingsParagraph>
            )}

            {currentMember && !user.isSubUser && (
                <div className="mb-4 flex gap-2 self-start items-center">
                    <div className="mr-4">
                        {mustActivateOrganizationKey ? (
                            <Alert className="mb-4" type="warning">
                                {c('Warning')
                                    .jt`You must ${activateLink} the organization key before adding an email address to a non-private member.`}
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

            {(() => {
                if (isSelfSelected) {
                    return (
                        <AddressesWithUser
                            user={user}
                            member={currentMember}
                            organizationKey={organizationKey}
                            hasDescription={false}
                            allowAddressDeletion={allowAddressDeletion}
                        />
                    );
                }

                if (membersWithError.length) {
                    return (
                        <GenericError>
                            <Button onClick={() => retry(membersWithError)}>{c('Action').t`Retry`}</Button>
                        </GenericError>
                    );
                }

                return (
                    <AddressesTable
                        hasUsername={hasUsernameDisplay}
                        loading={selectedMembers.some(({ ID }) => !Array.isArray(memberAddressesMap?.[ID]))}
                        user={user}
                        members={selectedMembers}
                        memberAddressesMap={memberAddressesMap}
                        organizationKey={organizationKey}
                        allowAddressDeletion={allowAddressDeletion}
                    />
                );
            })()}
        </>
    );
    const loading = loadingMembers || loadingAddresses || memberIndex === -1;

    return (
        <>
            {renderAddressModal && tmpMember && members && (
                <AddressModal member={tmpMember} members={members} {...addressModalProps} />
            )}
            {loading ? <Loader /> : children}
        </>
    );
};

export default AddressesWithMembers;
