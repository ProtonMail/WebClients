import { c } from 'ttag';
import {
    SidebarList,
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    SidebarListItemLink,
    useOrganization,
} from '@proton/components';

const OrganizationSettingsSidebarList = ({ appSlug }: { appSlug: string }) => {
    const [organization, loading] = useOrganization();

    const hasOrganization = organization?.HasKeys;

    return (
        <SidebarList>
            {!loading &&
                (hasOrganization ? (
                    <>
                        <SidebarListItem>
                            <SidebarListItemLink to={`/${appSlug}/users-addresses`}>
                                <SidebarListItemContent left={<SidebarListItemContentIcon name="people" />}>
                                    {c('Settings section title').t`Users and addresses`}
                                </SidebarListItemContent>
                            </SidebarListItemLink>
                        </SidebarListItem>
                        <SidebarListItem>
                            <SidebarListItemLink to={`/${appSlug}/domain-names`}>
                                <SidebarListItemContent left={<SidebarListItemContentIcon name="globe" />}>
                                    {c('Settings section title').t`Domain names`}
                                </SidebarListItemContent>
                            </SidebarListItemLink>
                        </SidebarListItem>
                        <SidebarListItem>
                            <SidebarListItemLink to={`/${appSlug}/organization-keys`}>
                                <SidebarListItemContent left={<SidebarListItemContentIcon name="shield" />}>
                                    {c('Settings section title').t`Organization and keys`}
                                </SidebarListItemContent>
                            </SidebarListItemLink>
                        </SidebarListItem>
                    </>
                ) : (
                    <SidebarListItem>
                        <SidebarListItemLink to={`/${appSlug}/multi-user-support`}>
                            <SidebarListItemContent left={<SidebarListItemContentIcon name="people" />}>
                                {c('Settings section title').t`Multi-user support`}
                            </SidebarListItemContent>
                        </SidebarListItemLink>
                    </SidebarListItem>
                ))}
        </SidebarList>
    );
};

export default OrganizationSettingsSidebarList;
