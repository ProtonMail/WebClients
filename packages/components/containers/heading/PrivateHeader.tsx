import React from 'react';
import { APPS } from 'proton-shared/lib/constants';
import {
    AppsDropdown,
    Hamburger,
    MainLogo,
    SupportDropdown,
    TopNavbar,
    TopNavbarLink,
    UpgradeButton,
    UpgradeVPNButton,
    useUser,
    useConfig,
} from '../../index';
import { c } from 'ttag';
import Header, { Props as HeaderProps } from '../../components/header/Header';
import UserDropdown from './UserDropdown';
import { TopNavbarItem } from '../app/TopNavbar';

interface Props extends HeaderProps {
    url?: string;
    externalUrl?: boolean;
    settingsUrl?: string;
    externalSettingsUrl?: boolean;
    backUrl?: string;
    floatingButton?: React.ReactNode;
    searchBox?: React.ReactNode;
    searchDropdown?: React.ReactNode;
    hasAppsDropdown?: boolean;
    title: string;
    expanded: boolean;
    onToggleExpand?: () => void;
    isNarrow?: boolean;
}
const PrivateHeader = ({
    isNarrow,
    hasAppsDropdown = true,
    url,
    externalUrl,
    settingsUrl,
    externalSettingsUrl,
    backUrl,
    searchBox,
    searchDropdown,
    floatingButton,
    expanded,
    onToggleExpand,
    title,
}: Props) => {
    const [{ hasPaidMail, hasPaidVpn }] = useUser();
    const { APP_NAME } = useConfig();

    if (backUrl) {
        return (
            <Header>
                <TopNavbarLink
                    data-test-id="view:general-back"
                    to={backUrl}
                    icon="arrow-left"
                    text={c('Title').t`Back`}
                />
                <TopNavbar>
                    <TopNavbarItem>
                        <UserDropdown />
                    </TopNavbarItem>
                </TopNavbar>
            </Header>
        );
    }

    const logo = (
        <div className="logo-container flex flex-spacebetween flex-items-center flex-nowrap nomobile">
            <MainLogo url={url} external={externalUrl} />
            {hasAppsDropdown ? <AppsDropdown /> : null}
        </div>
    );

    return (
        <Header>
            {logo}
            <Hamburger expanded={expanded} onToggle={onToggleExpand} />
            {title && isNarrow ? <span className="big lh-standard mtauto mbauto ellipsis">{title}</span> : null}
            {isNarrow ? null : searchBox}
            <TopNavbar>
                {isNarrow && searchDropdown ? <TopNavbarItem>{searchDropdown}</TopNavbarItem> : null}
                {hasPaidMail || isNarrow || APP_NAME === APPS.PROTONVPN_SETTINGS ? null : (
                    <TopNavbarItem>
                        <UpgradeButton external={true} />
                    </TopNavbarItem>
                )}
                {hasPaidVpn || isNarrow || APP_NAME !== APPS.PROTONVPN_SETTINGS ? null : (
                    <TopNavbarItem>
                        <UpgradeVPNButton />
                    </TopNavbarItem>
                )}
                {!settingsUrl ? null : (
                    <TopNavbarItem>
                        <TopNavbarLink
                            data-test-id="view:general-settings"
                            to={settingsUrl}
                            external={externalSettingsUrl}
                            icon="settings-master"
                            text={c('Title').t`Settings`}
                        />
                    </TopNavbarItem>
                )}
                <TopNavbarItem>
                    <SupportDropdown />
                </TopNavbarItem>
                <TopNavbarItem className="relative">
                    <UserDropdown />
                </TopNavbarItem>
            </TopNavbar>
            {isNarrow && floatingButton ? floatingButton : null}
        </Header>
    );
};

export default PrivateHeader;
