import { c } from 'ttag';

import {
    Icon,
    SectionConfig,
    SidebarExpandButton,
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    SidebarListItemLink,
    generateUID,
    useToggle,
} from '@proton/components';
import { getSectionPath } from '@proton/components/containers/layout/helper';
import { useApiWalletsData } from '@proton/wallet';

interface Props {
    prefix: string;
    config: SectionConfig;
}

export const WalletsSettingsSidebarList = ({ prefix, config }: Props) => {
    const [wallets] = useApiWalletsData();

    const headerId = generateUID('WalletsListHeader');
    const contentId = generateUID('WalletsListContent');

    const { state: expanded, toggle: toggleExpanded, set: setExpanded } = useToggle(true);

    const sectionPath = getSectionPath(prefix, config);

    return (
        <SidebarListItem>
            <SidebarListItemLink
                className="navigation-link--collapsible mb-1"
                to={sectionPath}
                exact
                onClick={() => setExpanded(true)}
                id={headerId}
            >
                <SidebarListItemContent
                    left={<SidebarListItemContentIcon name={config.icon} />}
                    right={
                        <SidebarExpandButton
                            title={
                                expanded
                                    ? c('Wallet Settings').t`Collapse wallets setting`
                                    : c('Wallet Settings').t`Expand wallets setting`
                            }
                            expanded={expanded}
                            onClick={toggleExpanded}
                        />
                    }
                >
                    <span className="text-ellipsis" title={config.text}>
                        {config.text}
                    </span>
                </SidebarListItemContent>
            </SidebarListItemLink>

            {wallets && (
                <section aria-labelledby={headerId} aria-hidden={!expanded}>
                    <ul className="unstyled" id={contentId} hidden={!expanded}>
                        {wallets.map((wallet) => (
                            <SidebarListItem key={wallet.Wallet.ID}>
                                <SidebarListItemLink
                                    to={`${sectionPath}/${wallet.Wallet.ID}`}
                                    className="navigation-link-child"
                                >
                                    <SidebarListItemContent left={<Icon name="wallet" />}>
                                        <span title={wallet.Wallet.Name} className="text-ellipsis">
                                            {wallet.Wallet.Name}
                                        </span>
                                    </SidebarListItemContent>
                                </SidebarListItemLink>
                            </SidebarListItem>
                        ))}
                    </ul>
                </section>
            )}
        </SidebarListItem>
    );
};
