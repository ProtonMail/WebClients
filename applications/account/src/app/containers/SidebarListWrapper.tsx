import { useRef } from 'react';

import type { SidebarConfig } from '@proton/components';
import { SettingsListItem, SidebarList, SidebarListItem } from '@proton/components';
import { getIsSectionAvailable, getSectionPath } from '@proton/components/containers/layout/helper';
import { SettingsReferralSpotlight } from '@proton/components/containers/referral/components/SettingsReferralSpotlight';

interface Props extends SidebarConfig {
    prefix: string;
}

const SidebarListWrapper = ({ header, routes, prefix }: Props) => {
    const referralRef = useRef<HTMLLIElement>(null);

    return (
        <SidebarList>
            <SidebarListItem className="navigation-link-header-group">
                <h3>{header}</h3>
            </SidebarListItem>
            {Object.values(routes).map((section) => {
                if (section.to === '/referral' && getIsSectionAvailable(section)) {
                    return (
                        <SettingsReferralSpotlight anchorRef={referralRef} key={section.to}>
                            <SettingsListItem
                                ref={referralRef}
                                to={getSectionPath(prefix, section)}
                                icon={section.icon}
                                notification={section.notification}
                                key={section.to}
                            >
                                <span className="text-ellipsis" title={section.text}>
                                    {section.text}
                                </span>
                            </SettingsListItem>
                        </SettingsReferralSpotlight>
                    );
                }
                return (
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
                );
            })}
        </SidebarList>
    );
};

export default SidebarListWrapper;
