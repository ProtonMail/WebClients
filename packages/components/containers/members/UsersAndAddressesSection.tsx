import { useState, useMemo } from 'react';
import { c } from 'ttag';
import { getInitials, normalize } from '@proton/shared/lib/helpers/string';
import { DOMAIN_STATE, MEMBER_ROLE } from '@proton/shared/lib/constants';
import { getOrganizationKeyInfo } from '@proton/shared/lib/organization/helper';
import { Organization as tsOrganization, Domain, CachedOrganizationKey, Member } from '@proton/shared/lib/interfaces';
import { removeMember, updateRole } from '@proton/shared/lib/api/members';
import { revokeSessions } from '@proton/shared/lib/api/memberSessions';
import {
    Table,
    TableCell,
    Info,
    Block,
    SearchInput,
    TableBody,
    TableRow,
    Badge,
    Button,
    useModalState,
} from '../../components';
import {
    useMembers,
    useOrganization,
    useMemberAddresses,
    useDomains,
    useNotifications,
    useOrganizationKey,
    useApi,
    useEventManager,
} from '../../hooks';

import MemberActions from './MemberActions';
import MemberAddresses from './MemberAddresses';
import MemberFeatures from './MemberFeatures';
import MemberRole from './MemberRole';
import RestoreAdministratorPrivileges from '../organization/RestoreAdministratorPrivileges';
import MemberModal from './MemberModal';
import useDomainsAddresses from '../../hooks/useDomainsAddresses';
import Avatar from '../../components/avatar';
import { SettingsParagraph, SettingsSectionWide } from '../account';

import './UsersAndAddressesSection.scss';
import { AddressModal } from '../addresses';
import EditMemberModal from './EditMemberModal';
import DeleteMemberModal from './DeleteMemberModal';

const validateAddUser = (
    organization: tsOrganization,
    organizationKey: CachedOrganizationKey | undefined,
    verifiedDomains: Domain[]
) => {
    const organizationKeyInfo = getOrganizationKeyInfo(organization, organizationKey);
    const { MaxMembers, HasKeys, UsedMembers, MaxAddresses, UsedAddresses, MaxSpace, AssignedSpace } = organization;
    if (MaxMembers === 1) {
        return c('Error')
            .t`Please upgrade to a Professional plan with more than 1 user, or a Visionary account, to manage multiple users.`;
    }
    if (!HasKeys) {
        return c('Error').t`Please enable multi-user support before adding users to your organization.`;
    }
    if (!verifiedDomains.length) {
        return c('Error').t`Please configure a custom domain before adding users to your organization.`;
    }
    if (MaxMembers - UsedMembers < 1) {
        return c('Error').t`You have used all users in your plan. Please upgrade your plan to add a new user.`;
    }
    if (MaxAddresses - UsedAddresses < 1) {
        return c('Error').t`You have used all addresses in your plan. Please upgrade your plan to add a new address.`;
    }
    if (MaxSpace - AssignedSpace < 1) {
        return c('Error').t`All storage space has been allocated. Please reduce storage allocated to other users.`;
    }
    if (organizationKeyInfo.userNeedsToActivateKey) {
        return c('Error').t`The organization key must be activated first.`;
    }
    if (organizationKeyInfo.userNeedsToReactivateKey) {
        return c('Error').t`Permission denied, administrator privileges have been restricted.`;
    }
    if (!organizationKey?.privateKey) {
        return c('Error').t`Organization key is not decrypted.`;
    }
};

const { DOMAIN_STATE_ACTIVE } = DOMAIN_STATE;

const UsersAndAddressesSection = () => {
    const [organization, loadingOrganization] = useOrganization();
    const [organizationKey, loadingOrganizationKey] = useOrganizationKey(organization);
    const [domains, loadingDomains] = useDomains();
    const [domainsAddressesMap, loadingDomainAddresses] = useDomainsAddresses(domains);
    const [members, loadingMembers] = useMembers();
    const [memberAddressesMap, loadingMemberAddresses] = useMemberAddresses(members);
    const [keywords, setKeywords] = useState('');
    const [tmpMember, setTmpMember] = useState<Member | null>(null);
    const api = useApi();
    const { call } = useEventManager();

    const { createNotification } = useNotifications();
    const [addressModalProps, setAddressModalOpen, renderAddressModal] = useModalState();
    const [memberModalProps, setMemberModalOpen, renderMemberModal] = useModalState();
    const [editMemberModal, setEditMemberModal, renderEditMemberModal] = useModalState();
    const [deleteMemberModal, setDeleteMemberModal, renderDeleteMemberModal] = useModalState();

    const verifiedDomains = useMemo(
        () => (domains || []).filter(({ State }) => State === DOMAIN_STATE_ACTIVE),
        [domains]
    );

    const handleSearch = (value: string) => setKeywords(value);

    const membersSelected = useMemo(() => {
        if (!members) {
            return [];
        }
        if (!keywords) {
            return members;
        }

        const normalizedWords = normalize(keywords, true);

        return members.filter(({ Name, ID }) => {
            const addressMatch = memberAddressesMap?.[ID]?.some((address) =>
                normalize(address.Email, true).includes(normalizedWords)
            );
            const nameMatch = normalize(Name, true).includes(normalizedWords);

            return addressMatch || nameMatch;
        });
    }, [keywords, members]);

    const handleDeleteUserConfirm = async (member: Member) => {
        if (member.Role === MEMBER_ROLE.ORGANIZATION_ADMIN) {
            await api(updateRole(member.ID, MEMBER_ROLE.ORGANIZATION_MEMBER));
        }
        await api(removeMember(member.ID));
        await call();
        createNotification({ text: c('Success message').t`User deleted` });
    };

    const handleDeleteUser = async (member: Member) => {
        setTmpMember(member);
        setDeleteMemberModal(true);
    };

    const handleRevokeUserSessions = async (member: Member) => {
        await api(revokeSessions(member.ID));
        await call();
        createNotification({ text: c('Success message').t`Sessions revoked` });
    };

    const handleAddUser = () => {
        const error = validateAddUser(organization, organizationKey, verifiedDomains);
        if (error) {
            return createNotification({ type: 'error', text: error });
        }
        if (!organizationKey?.privateKey) {
            return createNotification({ type: 'error', text: c('Error').t`Organization key is not decrypted` });
        }

        setMemberModalOpen(true);
    };

    const handleAddAddress = () => {
        setAddressModalOpen(true);
    };

    const handleEditUser = (member: Member) => {
        setTmpMember(member);
        setEditMemberModal(true);
    };

    const headerCells = [
        { node: c('Title header for members table').t`Name` },
        {
            node: (
                <>
                    <span className="mr0-5">{c('Title header for members table').t`Role`}</span>
                    <span className="no-mobile">
                        <Info url="https://protonmail.com/support/knowledge-base/member-roles/" />
                    </span>
                </>
            ),
        },
        {
            node: (
                <>
                    <span
                        className="text-ellipsis inline-block align-bottom max-w100"
                        title={c('Title header for members table').t`Addresses`}
                    >{c('Title header for members table').t`Addresses`}</span>
                </>
            ),
        },
        {
            node: (
                <>
                    <span
                        className="text-ellipsis inline-block align-bottom max-w100"
                        title={c('Title header for members table').t`Features`}
                    >{c('Title header for members table').t`Features`}</span>
                </>
            ),
            className: 'no-mobile',
        },
        { node: c('Title').t`Action` },
    ].map(({ node, className = '' }, i) => {
        return (
            <TableCell key={i.toString()} className={className} type="header">
                {node}
            </TableCell>
        );
    });

    return (
        <SettingsSectionWide>
            <RestoreAdministratorPrivileges />
            <SettingsParagraph>
                {c('Info for members section')
                    .t`Add, remove, and manage users within your organization. Here you can adjust their allocated storage space, grant admin rights, and more. Select a user to manage their email addresses. The email address at the top of the list will automatically be selected as the default email address.`}
            </SettingsParagraph>
            <Block className="flex flex-align-items-start">
                {renderAddressModal && (
                    <AddressModal members={members} organizationKey={organizationKey} {...addressModalProps} />
                )}
                {renderDeleteMemberModal && tmpMember && (
                    <DeleteMemberModal member={tmpMember} onDelete={handleDeleteUserConfirm} {...deleteMemberModal} />
                )}
                {renderEditMemberModal && tmpMember && <EditMemberModal member={tmpMember} {...editMemberModal} />}
                {renderMemberModal && organizationKey && domains?.length && (
                    <MemberModal
                        organization={organization}
                        organizationKey={organizationKey}
                        domains={verifiedDomains}
                        domainsAddressesMap={domainsAddressesMap}
                        {...memberModalProps}
                    />
                )}
                <Button
                    color="norm"
                    disabled={loadingOrganization || loadingDomains || loadingDomainAddresses || loadingOrganizationKey}
                    onClick={handleAddUser}
                    className="on-mobile-mb0-5 mr1"
                >
                    {c('Action').t`Add user`}
                </Button>
                <div className="flex-item-fluid mb1 mr1">
                    <Button
                        shape="outline"
                        disabled={
                            loadingOrganization || loadingDomains || loadingDomainAddresses || loadingOrganizationKey
                        }
                        onClick={handleAddAddress}
                        className="on-mobile-mb0-5"
                    >
                        {c('Action').t`Add address`}
                    </Button>
                </div>
                <div className="on-mobile-w100">
                    <SearchInput
                        onChange={handleSearch}
                        placeholder={c('Placeholder').t`Search users`}
                        delay={500}
                        value={keywords}
                    />
                </div>
            </Block>
            <Table className="simple-table--has-actions members-table">
                <thead>
                    <tr>{headerCells}</tr>
                </thead>
                <TableBody loading={loadingMembers || loadingMemberAddresses} colSpan={6}>
                    {membersSelected.map((member) => {
                        const memberAddresses = memberAddressesMap?.[member.ID] || [];
                        return (
                            <TableRow
                                key={member.ID}
                                className="on-mobile-hide-td4 pt1 pb1"
                                cells={[
                                    <span
                                        className="pt1 pb1 text-ellipsis max-w100 inline-block flex flex-nowrap flex-align-items-start"
                                        title={member.Name}
                                    >
                                        <Avatar className="mr1">{getInitials(member.Name)}</Avatar>
                                        <div>
                                            <span className="block">{member.Name}</span>
                                            {Boolean(member.Private) && (
                                                <Badge type="light">{c('Private Member').t`private`}</Badge>
                                            )}
                                        </div>
                                    </span>,
                                    <span className="pt1 pb1 inline-block">
                                        <MemberRole member={member} />
                                    </span>,
                                    <span className="pt1 pb1 inline-block max-w15e">
                                        <MemberAddresses addresses={memberAddresses} />
                                    </span>,
                                    <span className="pt1 pb1 inline-block">
                                        <MemberFeatures member={member} />
                                    </span>,
                                    <span className="pt1 pb1 inline-block">
                                        <MemberActions
                                            onEdit={handleEditUser}
                                            onDelete={handleDeleteUser}
                                            onRevoke={handleRevokeUserSessions}
                                            member={member}
                                            addresses={memberAddresses}
                                            organization={organization}
                                            organizationKey={organizationKey}
                                        />
                                    </span>,
                                ]}
                            />
                        );
                    })}
                </TableBody>
            </Table>

            <div className="members-table-mobile">
                {membersSelected.map((member) => {
                    const memberAddresses = (memberAddressesMap && memberAddressesMap[member.ID]) || [];

                    return (
                        <div key={member.ID} className="pt1 pb1 border-bottom">
                            <div className="flex mb1-5">
                                <span style={{ '--min-width-custom': `100px` }} className="text-bold min-w-custom mr1">
                                    {c('Title header for members table').t`Name`}
                                </span>
                                <div>
                                    <span className="block">{member.Name}</span>
                                    {Boolean(member.Private) && (
                                        <Badge type="light">{c('Private Member').t`private`}</Badge>
                                    )}
                                </div>
                            </div>
                            <div className="flex mb1-5">
                                <span style={{ '--min-width-custom': `100px` }} className="text-bold min-w-custom mr1">
                                    <span className="mr0-5">{c('Title header for members table').t`Role`}</span>
                                    <span className="no-mobile">
                                        <Info url="https://protonmail.com/support/knowledge-base/member-roles/" />
                                    </span>
                                </span>
                                <MemberRole member={member} />
                            </div>
                            <div className="flex mb1-5">
                                <span style={{ '--min-width-custom': `100px` }} className="text-bold min-w-custom mr1">
                                    <span
                                        className="text-ellipsis inline-block align-bottom max-w100"
                                        title={c('Title header for members table').t`Addresses`}
                                    >{c('Title header for members table').t`Addresses`}</span>
                                </span>
                                <MemberAddresses addresses={memberAddresses} />
                            </div>
                            <div className="flex mb1-5">
                                <div style={{ '--min-width-custom': `100px` }} className="text-bold min-w-custom mr1">
                                    <span
                                        className="text-ellipsis inline-block align-bottom max-w100"
                                        title={c('Title header for members table').t`Features`}
                                    >{c('Title header for members table').t`Features`}</span>
                                </div>
                                <div>
                                    <MemberFeatures member={member} />
                                </div>
                            </div>
                            <div className="flex mb1-5">
                                <span style={{ '--min-width-custom': `100px` }} className="min-w-custom mr1" />
                                <MemberActions
                                    onEdit={handleEditUser}
                                    onDelete={handleDeleteUser}
                                    onRevoke={handleRevokeUserSessions}
                                    member={member}
                                    addresses={memberAddresses}
                                    organization={organization}
                                    organizationKey={organizationKey}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </SettingsSectionWide>
    );
};

export default UsersAndAddressesSection;
