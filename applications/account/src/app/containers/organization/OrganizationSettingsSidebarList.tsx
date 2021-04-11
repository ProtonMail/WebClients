import React from 'react';

import {
    SidebarList,
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    SidebarListItemLink,
    useOrganization,
} from 'react-components';

const OrganizationSettingsSidebarList = ({ prefix }: { prefix: string }) => {
    const [organization] = useOrganization();

    const hasOrganization = organization?.HasKeys;

    return (
        <SidebarList>
            {hasOrganization ? (
                <>
                    <SidebarListItem>
                        <SidebarListItemLink to={`/${prefix}/users-addresses`}>
                            <SidebarListItemContent left={<SidebarListItemContentIcon name="organization-users" />}>
                                Users & Addresses
                            </SidebarListItemContent>
                        </SidebarListItemLink>
                    </SidebarListItem>
                    <SidebarListItem>
                        <SidebarListItemLink to={`/${prefix}/domain-names`}>
                            <SidebarListItemContent left={<SidebarListItemContentIcon name="globe" />}>
                                Domain names
                            </SidebarListItemContent>
                        </SidebarListItemLink>
                    </SidebarListItem>
                    <SidebarListItem>
                        <SidebarListItemLink to={`/${prefix}/organization-keys`}>
                            <SidebarListItemContent left={<SidebarListItemContentIcon name="security" />}>
                                Organization & Keys
                            </SidebarListItemContent>
                        </SidebarListItemLink>
                    </SidebarListItem>
                </>
            ) : (
                <SidebarListItem>
                    <SidebarListItemLink to={`/${prefix}/multi-user-support`}>
                        <SidebarListItemContent left={<SidebarListItemContentIcon name="organization-users" />}>
                            Multi-user support
                        </SidebarListItemContent>
                    </SidebarListItemLink>
                </SidebarListItem>
            )}
        </SidebarList>
    );
};

export default OrganizationSettingsSidebarList;
