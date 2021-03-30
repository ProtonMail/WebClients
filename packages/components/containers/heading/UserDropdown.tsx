import React, { useEffect, useState } from 'react';
import { c } from 'ttag';
import { APPS, FEATURE_FLAGS, isSSOMode, SSO_PATHS } from 'proton-shared/lib/constants';
import { getAccountSettingsApp, getAppHref } from 'proton-shared/lib/apps/helper';
import { requestFork } from 'proton-shared/lib/authentication/sessionForking';
import { FORK_TYPE } from 'proton-shared/lib/authentication/ForkInterface';
import { updateThemeType } from 'proton-shared/lib/api/settings';
import { ThemeTypes } from 'proton-shared/lib/themes/themes';

import {
    useAuthentication,
    useConfig,
    useModals,
    useUser,
    useApi,
    useUserSettings,
    useOrganization,
} from '../../hooks';
import {
    ButtonLike,
    usePopperAnchor,
    Dropdown,
    Icon,
    AppLink,
    SelectTwo,
    Option,
    Href,
    Button,
    Toggle,
} from '../../components';
import { generateUID } from '../../helpers';
import UserDropdownButton from './UserDropdownButton';
import { DonateModal } from '../payments';
import { useThemeStyle } from '../themes';
import { getThemeStyle } from '../themes/ThemeInjector';

const UserDropdown = ({ ...rest }) => {
    const { APP_NAME } = useConfig();
    const api = useApi();
    const [organization] = useOrganization();
    const { Name: organizationName } = organization || {};
    const [user] = useUser();
    const [userSettings] = useUserSettings();
    const { canPay, isSubUser } = user;
    const { logout } = useAuthentication();
    const { createModal } = useModals();
    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const actualThemeType = userSettings.ThemeType;
    const [, setThemeStyle] = useThemeStyle();
    const [themeType, setThemeType] = useState(actualThemeType);

    useEffect(() => {
        // Updates from ev
        setThemeType(themeType);
    }, [actualThemeType]);

    const handleSupportUsClick = () => {
        createModal(<DonateModal />);
        close();
    };

    const handleSwitchAccount = () => {
        if (APP_NAME === APPS.PROTONACCOUNT) {
            const href = getAppHref(SSO_PATHS.SWITCH, APPS.PROTONACCOUNT);
            return document.location.assign(href);
        }
        return requestFork(APP_NAME, undefined, FORK_TYPE.SWITCH);
    };

    const handleLogout = () => {
        logout();
        close();
    };

    const handleThemeChange = (themeType: ThemeTypes) => {
        setThemeType(themeType);
        setThemeStyle(getThemeStyle(themeType));
        api(updateThemeType(themeType));
    };

    const handleThemeToggle = () => {
        handleThemeChange(themeType === ThemeTypes.Dark ? ThemeTypes.Default : ThemeTypes.Dark);
    };

    return (
        <>
            <UserDropdownButton
                data-cy-header="userDropdown"
                {...rest}
                user={user}
                ref={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
            />
            <Dropdown
                id={uid}
                className="userDropdown"
                style={{ '--min-width': '20em' }}
                isOpen={isOpen}
                noMaxSize
                anchorRef={anchorRef}
                autoClose={false}
                onClose={close}
                originalPlacement="bottom-right"
            >
                <ul className="unstyled mt1 mb1">
                    {APP_NAME !== APPS.PROTONVPN_SETTINGS ? (
                        <>
                            <li className="pl1 pr1">
                                {organizationName ? (
                                    <>
                                        <div className="color-weak text-sm m0">{c('Label').t`Organization`}</div>
                                        <div className="mb1">{organizationName}</div>
                                    </>
                                ) : null}
                                <ButtonLike
                                    as={AppLink}
                                    to="/"
                                    color="norm"
                                    shape="outline"
                                    className="block w100 mt1-5 mb1-5 text-center"
                                    toApp={getAccountSettingsApp()}
                                    onClick={() => close()}
                                >
                                    {c('Action').t`Manage account`}
                                </ButtonLike>
                            </li>
                            <li className="dropdown-item-hr mt0-5 mb0-5" aria-hidden="false" />
                        </>
                    ) : null}
                    {isSSOMode ? (
                        <li>
                            <button
                                type="button"
                                className="w100 flex dropdown-item-link pl1 pr1 pt0-5 pb0-5 text-left"
                                onClick={handleSwitchAccount}
                            >
                                <Icon className="mt0-25 mr0-5" name="organization-users" />
                                {c('Action').t`Switch account`}
                            </button>
                        </li>
                    ) : null}
                    <li>
                        <Href
                            className="w100 flex flex-nowrap dropdown-item-link text-no-decoration pl1 pr1 pt0-5 pb0-5"
                            url="https://shop.protonmail.com"
                            onClick={() => close()}
                        >
                            <Icon className="mt0-25 mr0-5" name="shop" />
                            {c('Action').t`Proton shop`}
                        </Href>
                    </li>
                    {canPay && !isSubUser ? (
                        <li>
                            <button
                                type="button"
                                className="w100 flex dropdown-item-link pl1 pr1 pt0-5 pb0-5 text-left"
                                onClick={handleSupportUsClick}
                            >
                                <Icon className="mt0-25 mr0-5" name="donate" />
                                {c('Action').t`Support us`}
                            </button>
                        </li>
                    ) : null}
                    <li className="dropdown-item-hr mt0-5" aria-hidden="false" />
                    <li>
                        {FEATURE_FLAGS.includes('theme-selector') ? (
                            <div className="pl1 pr1 pt0-5 pb0-5">
                                <label htmlFor="theme-toggle" className="block mb0-5">{c('Action').t`Theme`}</label>
                                <SelectTwo
                                    id="theme-toggle"
                                    title={c('Title').t`Toggle display mode`}
                                    value={themeType}
                                    onChange={({ value }) => handleThemeChange(value)}
                                >
                                    <Option title="Default" value={ThemeTypes.Default} />
                                    <Option title="Dark" value={ThemeTypes.Dark} />
                                    <Option title="Light" value={ThemeTypes.Light} />
                                    <Option title="Monokai" value={ThemeTypes.Monokai} />
                                    <Option title="Contrast" value={ThemeTypes.Contrast} />
                                </SelectTwo>
                            </div>
                        ) : (
                            <div className="pl1 pr1 pt0-5 pb0-5 w100 flex-no-min-children flex-nowrap flex-justify-space-between flex-align-items-center">
                                <label htmlFor="theme-toggle" className="mr1">{c('Action').t`Dark mode`}</label>
                                <Toggle
                                    id="theme-toggle"
                                    title={c('Title').t`Toggle display mode`}
                                    checked={themeType === ThemeTypes.Dark}
                                    onChange={handleThemeToggle}
                                />
                            </div>
                        )}
                    </li>
                    <li className="dropdown-item-hr mb0-5" aria-hidden="false" />
                    <li className="pt0-5 pb0-5 pl1 pr1 flex">
                        <Button
                            color="norm"
                            className="w100 text-center navigationUser-logout"
                            onClick={handleLogout}
                            data-cy-header-user-dropdown="logout"
                        >
                            {c('Action').t`Sign out`}
                        </Button>
                    </li>
                </ul>
            </Dropdown>
        </>
    );
};

export default UserDropdown;
