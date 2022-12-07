import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { Avatar, Button } from '@proton/atoms';
import { revokeSessions } from '@proton/shared/lib/api/memberSessions';
import { removeMember, updateRole } from '@proton/shared/lib/api/members';
import { APP_NAMES, DOMAIN_STATE, MEMBER_ROLE } from '@proton/shared/lib/constants';
import { getInitials, normalize } from '@proton/shared/lib/helpers/string';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { Member } from '@proton/shared/lib/interfaces';

import {
    Badge,
    Block,
    Info,
    SearchInput,
    Table,
    TableBody,
    TableCell,
    TableRow,
    useModalState,
} from '../../components';
import {
    useApi,
    useDomains,
    useEventManager,
    useMemberAddresses,
    useMembers,
    useNotifications,
    useOrganization,
    useOrganizationKey,
} from '../../hooks';
import { SettingsParagraph, SettingsSectionWide } from '../account';
import { AddressModal } from '../addresses';
import RestoreAdministratorPrivileges from '../organization/RestoreAdministratorPrivileges';
import DeleteMemberModal from './DeleteMemberModal';
import EditMemberModal from './EditMemberModal';
import LoginMemberModal, { validateMemberLogin } from './LoginMemberModal';
import MemberActions from './MemberActions';
import MemberAddresses from './MemberAddresses';
import MemberFeatures from './MemberFeatures';
import MemberModal from './MemberModal';
import MemberRole from './MemberRole';
import validateAddUser from './validateAddUser';

const { DOMAIN_STATE_ACTIVE } = DOMAIN_STATE;

const UsersAndAddressesSection = ({ app }: { app: APP_NAMES }) => {
    const [organization, loadingOrganization] = useOrganization();
    const [organizationKey, loadingOrganizationKey] = useOrganizationKey(organization);
    const [domains, loadingDomains] = useDomains();
    const [members, loadingMembers] = useMembers();
    const [memberAddressesMap] = useMemberAddresses(members, true);
    const [keywords, setKeywords] = useState('');
    const [tmpMember, setTmpMember] = useState<Member | null>(null);
    const api = useApi();
    const { call } = useEventManager();

    const { createNotification } = useNotifications();
    const [addressModalProps, setAddressModalOpen, renderAddressModal] = useModalState();
    const [memberModalProps, setMemberModalOpen, renderMemberModal] = useModalState();
    const [editMemberModal, setEditMemberModal, renderEditMemberModal] = useModalState();
    const [loginMemberModal, setLoginMemberModal, renderLoginMemberModal] = useModalState();
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

        return members.filter((member) => {
            const memberAddresses = memberAddressesMap?.[member.ID] || [];
            const addressMatch = memberAddresses?.some((address) =>
                normalize(address.Email, true).includes(normalizedWords)
            );
            const nameMatch = normalize(member.Name, true).includes(normalizedWords);

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

    const handleLoginUser = (member: Member) => {
        const error = validateMemberLogin(organization, organizationKey);
        if (error) {
            return createNotification({ type: 'error', text: error });
        }
        setTmpMember(member);
        setLoginMemberModal(true);
    };

    const headerCells = [
        { node: c('Title header for members table').t`Name` },
        {
            node: (
                <>
                    <span className="mr0-5">{c('Title header for members table').t`Role`}</span>
                    <span className="no-mobile">
                        <Info url={getKnowledgeBaseUrl('/user-roles')} />
                    </span>
                </>
            ),
            className: 'w15',
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
        },
        { node: c('Title').t`Action`, className: 'w18' },
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
                {renderAddressModal && members && (
                    <AddressModal members={members} organizationKey={organizationKey} {...addressModalProps} />
                )}
                {renderDeleteMemberModal && tmpMember && (
                    <DeleteMemberModal member={tmpMember} onDelete={handleDeleteUserConfirm} {...deleteMemberModal} />
                )}
                {renderEditMemberModal && tmpMember && <EditMemberModal member={tmpMember} {...editMemberModal} />}
                {renderLoginMemberModal && tmpMember && (
                    <LoginMemberModal app={app} member={tmpMember} {...loginMemberModal} />
                )}
                {renderMemberModal && organizationKey && domains?.length && (
                    <MemberModal
                        organization={organization}
                        organizationKey={organizationKey}
                        domains={verifiedDomains}
                        {...memberModalProps}
                    />
                )}
                <Button
                    color="norm"
                    disabled={loadingOrganization || loadingDomains || loadingOrganizationKey}
                    onClick={handleAddUser}
                    className="on-mobile-mb0-5 mr1"
                >
                    {c('Action').t`Add user`}
                </Button>
                <div className="mb1 mr1">
                    <Button
                        shape="outline"
                        disabled={loadingOrganization || loadingDomains || loadingOrganizationKey || loadingMembers}
                        onClick={handleAddAddress}
                        className="on-mobile-mb0-5"
                    >
                        {c('Action').t`Add address`}
                    </Button>
                </div>
                <div className="mlauto on-tablet-ml0 on-tablet-w100">
                    <SearchInput
                        onChange={handleSearch}
                        placeholder={c('Placeholder').t`Search users`}
                        delay={500}
                        value={keywords}
                    />
                </div>
            </Block>
            <Table className="simple-table--has-actions no-tablet no-mobile">
                <thead>
                    <tr>{headerCells}</tr>
                </thead>
                <TableBody loading={loadingMembers} colSpan={5}>
                    {membersSelected.map((member) => {
                        const memberAddresses = memberAddressesMap?.[member.ID] || [];
                        return (
                            <TableRow
                                key={member.ID}
                                className="py1"
                                cells={[
                                    <span className="py1 flex flex-nowrap flex-align-items-center" title={member.Name}>
                                        <Avatar className="mr1 flex-item-noshrink">{getInitials(member.Name)}</Avatar>
                                        <div>
                                            <span className="block text-ellipsis flex-item-fluid">{member.Name}</span>
                                            {Boolean(member.Private) && (
                                                <Badge type="light">{c('Private Member').t`private`}</Badge>
                                            )}
                                        </div>
                                    </span>,
                                    <span className="py1 pr1 text-cut max-w100">
                                        <MemberRole member={member} />
                                    </span>,
                                    <span className="py1">
                                        <MemberAddresses addresses={memberAddresses} />
                                    </span>,
                                    <span className="py1">
                                        <MemberFeatures member={member} />
                                    </span>,
                                    <span className="py1">
                                        <MemberActions
                                            onEdit={handleEditUser}
                                            onDelete={handleDeleteUser}
                                            onRevoke={handleRevokeUserSessions}
                                            onLogin={handleLoginUser}
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

            <div className="no-desktop">
                {membersSelected.map((member) => {
                    const memberAddresses = memberAddressesMap?.[member.ID] || [];
                    return (
                        <div key={member.ID} className="py1 border-bottom">
                            <div className="flex-no-min-children flex-nowrap mb1-5 auto-tiny-mobile">
                                <div className="text-bold min-w7e mr1">
                                    {c('Title header for members table').t`Name`}
                                </div>
                                <div>
                                    <span className="block">{member.Name}</span>
                                    {Boolean(member.Private) && (
                                        <Badge type="light">{c('Private Member').t`private`}</Badge>
                                    )}
                                </div>
                            </div>
                            <div className="flex-no-min-children flex-nowrap mb1-5 auto-tiny-mobile">
                                <div className="text-bold min-w7e mr1">
                                    <span className="mr0-5">{c('Title header for members table').t`Role`}</span>
                                    <span className="no-mobile">
                                        <Info url={getKnowledgeBaseUrl('/user-roles')} />
                                    </span>
                                </div>
                                <div className="flex-item-fluid">
                                    <MemberRole member={member} />
                                </div>
                            </div>
                            <div className="flex-no-min-children flex-nowrap mb1-5 auto-tiny-mobile">
                                <div className="text-bold min-w7e mr1">
                                    {c('Title header for members table').t`Addresses`}
                                </div>
                                <div className="flex-item-fluid text-ellipsis">
                                    <MemberAddresses addresses={memberAddresses} />
                                </div>
                            </div>
                            <div className="flex-no-min-children flex-nowrap mb1-5 auto-tiny-mobile">
                                <div className="text-bold min-w7e mr1">
                                    <span
                                        className="text-ellipsis inline-block align-bottom max-w100"
                                        title={c('Title header for members table').t`Features`}
                                    >{c('Title header for members table').t`Features`}</span>
                                </div>
                                <div>
                                    <MemberFeatures member={member} />
                                </div>
                            </div>
                            <div className="flex-no-min-children flex-nowrap mb1-5 auto-tiny-mobile">
                                <div className="min-w14e mr1" />
                                <MemberActions
                                    onEdit={handleEditUser}
                                    onDelete={handleDeleteUser}
                                    onRevoke={handleRevokeUserSessions}
                                    onLogin={handleLoginUser}
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
