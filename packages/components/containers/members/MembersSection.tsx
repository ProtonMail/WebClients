import React, { useState, useMemo } from 'react';
import { c, msgid } from 'ttag';
import { normalize } from 'proton-shared/lib/helpers/string';
import { DOMAIN_STATE } from 'proton-shared/lib/constants';
import { Organization as tsOrganization, Domain, CachedOrganizationKey } from 'proton-shared/lib/interfaces';
import {
    Table,
    TableCell,
    Info,
    Block,
    Loader,
    Alert,
    SearchInput,
    TableBody,
    TableRow,
    PrimaryButton,
    Icon,
} from '../../components';
import {
    useMembers,
    useOrganization,
    useMemberAddresses,
    useDomains,
    useNotifications,
    useModals,
    useOrganizationKey,
} from '../../hooks';

import MemberActions from './MemberActions';
import MemberAddresses from './MemberAddresses';
import MemberFeatures from './MemberFeatures';
import MemberRole from './MemberRole';
import RestoreAdministratorPrivileges from '../organization/RestoreAdministratorPrivileges';
import MemberModal from './MemberModal';
import { getOrganizationKeyInfo } from '../organization/helpers/organizationKeysHelper';
import useDomainsAddresses from '../../hooks/useDomainsAddresses';

const validateAddUser = (
    organization: tsOrganization,
    organizationKey: CachedOrganizationKey | undefined,
    verifiedDomains: Domain[]
) => {
    const { isOrganizationKeyActive, hasOrganizationKey } = getOrganizationKeyInfo(organizationKey);
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
    if (!hasOrganizationKey) {
        return c('Error').t`The organization key must be activated first.`;
    }
    if (!isOrganizationKeyActive) {
        return c('Error').t`Permission denied, administrator privileges have been restricted.`;
    }
};

const { DOMAIN_STATE_ACTIVE } = DOMAIN_STATE;

const MembersSection = () => {
    const [members, membersLoading] = useMembers();
    const [organization, loadingOrganization] = useOrganization();
    const [organizationKey, loadingOrganizationKey] = useOrganizationKey(organization);
    const [domains, loadingDomains] = useDomains();
    const [domainsAddressesMap, loadingDomainAddresses] = useDomainsAddresses(domains);
    const [memberAddressesMap, loadingMemberAddresses] = useMemberAddresses(members);
    const [keywords, setKeywords] = useState('');

    const { createNotification } = useNotifications();
    const { createModal } = useModals();

    const handleSearch = (value: string) => setKeywords(value);

    const membersSelected = useMemo(() => {
        if (!keywords) {
            return members || [];
        }

        const normalizedWords = normalize(keywords);
        return members.filter(({ Name }) => {
            return normalize(Name).includes(normalizedWords);
        });
    }, [keywords, members]);

    const handleAddUser = () => {
        const verifiedDomains = domains.filter(({ State }) => State === DOMAIN_STATE_ACTIVE);

        const error = validateAddUser(organization, organizationKey, verifiedDomains);
        if (error) {
            return createNotification({ type: 'error', text: error });
        }
        if (!organizationKey?.privateKey) {
            return createNotification({ type: 'error', text: c('Error').t`Organization key is not decrypted.` });
        }

        createModal(
            <MemberModal
                organization={organization}
                organizationKey={organizationKey}
                domains={verifiedDomains}
                domainsAddressesMap={domainsAddressesMap}
            />
        );
    };

    if (loadingOrganization) {
        return <Loader />;
    }

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
                    <span className="mr0-5">{c('Title header for members table').t`Private`}</span>
                    <Info url="https://protonmail.com/support/knowledge-base/private-members/" />
                </>
            ),
            className: 'no-tablet no-mobile',
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
        <>
            <RestoreAdministratorPrivileges />
            <Alert learnMore="https://protonmail.com/support/knowledge-base/user-roles/">{c('Info for members section')
                .t`Add, remove, and manage users within your organization. Here you can adjust their allocated storage space, grant admin rights, and more.`}</Alert>
            <Block className="flex flex-justify-space-between">
                <PrimaryButton
                    disabled={loadingOrganization || loadingDomains || loadingDomainAddresses || loadingOrganizationKey}
                    onClick={handleAddUser}
                    className="on-mobile-mb0-5"
                >
                    {c('Action').t`Add user`}
                </PrimaryButton>
                <div>
                    <SearchInput
                        onChange={handleSearch}
                        placeholder={c('Placeholder').t`Search users`}
                        delay={500}
                        value={keywords}
                    />
                </div>
            </Block>
            <Table className="simple-table--has-actions">
                <thead>
                    <tr>{headerCells}</tr>
                </thead>
                <TableBody loading={membersLoading || loadingMemberAddresses} colSpan={6}>
                    {membersSelected.map((member) => {
                        const key = member.ID;
                        const memberAddresses = (memberAddressesMap && memberAddressesMap[member.ID]) || [];
                        return (
                            <TableRow
                                key={key}
                                className="on-tablet-hide-td3 on-mobile-hide-td5"
                                cells={[
                                    <span className="text-ellipsis max-w100 inline-block" title={member.Name}>
                                        {member.Name}
                                    </span>,
                                    <MemberRole member={member} />,
                                    <Icon name={member.Private ? 'on' : 'off'} />,
                                    <MemberAddresses addresses={memberAddresses} />,
                                    <MemberFeatures member={member} />,
                                    <MemberActions
                                        member={member}
                                        addresses={memberAddresses}
                                        organization={organization}
                                        organizationKey={organizationKey}
                                    />,
                                ]}
                            />
                        );
                    })}
                </TableBody>
            </Table>
            <Block className="color-weak">
                {organization.UsedMembers} / {organization.MaxMembers}{' '}
                {c('Info').ngettext(msgid`user used`, `users used`, organization.UsedMembers)}
            </Block>
        </>
    );
};

export default MembersSection;
