import { SettingsListItem, SidebarConfig, SidebarList, SidebarListItem } from '@proton/components';
import { getIsSectionAvailable, getSectionPath } from '@proton/components/containers/layout/helper';

interface Props extends SidebarConfig {
    prefix: string;
}

const SidebarListWrapper = ({ header, routes, prefix }: Props) => {
    return (
        <SidebarList>
            <SidebarListItem className="text-uppercase text-sm navigation-link-header-group">
                <h3>{header}</h3>
            </SidebarListItem>
            {Object.values(routes).map(
                (section) =>
                    getIsSectionAvailable(section) && (
                        <SettingsListItem
                            to={getSectionPath(prefix, section)}
                            icon={section.icon}
                            notification={section.notification}
                            key={section.to}
                        >
                            <span className="text-ellipsis" title={section.text}>
                                {section.text}
                            </span>
                        </SettingsListItem>
                    )
            )}
        </SidebarList>
    );
};

export default SidebarListWrapper;
