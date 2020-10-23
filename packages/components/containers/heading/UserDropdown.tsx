import React, { useState, useMemo } from 'react';
import { c } from 'ttag';
import { APPS, isSSOMode, SSO_PATHS } from 'proton-shared/lib/constants';
import { getAccountSettingsApp, getAppHref } from 'proton-shared/lib/apps/helper';
import { requestFork } from 'proton-shared/lib/authentication/sessionForking';
import { FORK_TYPE } from 'proton-shared/lib/authentication/ForkInterface';
import { updateThemeType } from 'proton-shared/lib/api/settings';
import { ThemeTypes } from 'proton-shared/lib/themes/themes';
import humanSize from 'proton-shared/lib/helpers/humanSize';
import { hasMailProfessional, hasVisionary } from 'proton-shared/lib/helpers/subscription';

import {
    useAuthentication,
    useConfig,
    useModals,
    useUser,
    useLoading,
    useApi,
    useEventManager,
    useUserSettings,
    useOrganization,
    useSubscription,
} from '../../hooks';
import { usePopperAnchor, Dropdown, Icon, Toggle, PrimaryButton, AppLink, Meter } from '../../components';
import { generateUID } from '../../helpers';
import { ToggleState } from '../../components/toggle/Toggle';
import UserDropdownButton from './UserDropdownButton';
import { DonateModal } from '../payments';

const UserDropdown = ({ ...rest }) => {
    const { APP_NAME } = useConfig();
    const api = useApi();
    const { call } = useEventManager();
    const [organization] = useOrganization();
    const [subscription] = useSubscription();
    const { Name: organizationName } = organization || {};
    const [user] = useUser();
    const [userSettings] = useUserSettings();
    const { UsedSpace, MaxSpace, isMember, canPay, isSubUser } = user;
    const spacePercentage = Math.round((UsedSpace * 100) / MaxSpace);
    const { logout } = useAuthentication();
    const { createModal } = useModals();
    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const [loading, withLoading] = useLoading();
    const canAddStorage = useMemo(() => {
        if (!subscription) {
            return false;
        }
        if (isSubUser) {
            return false;
        }
        if (isMember) {
            return false;
        }
        if (hasVisionary(subscription) || hasMailProfessional(subscription)) {
            return false;
        }
        return true;
    }, [subscription, user]);

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

    const handleThemeToggle = async () => {
        const newThemeType = userSettings.ThemeType === ThemeTypes.Dark ? ThemeTypes.Default : ThemeTypes.Dark;
        await api(updateThemeType(newThemeType));
        await call();
    };

    return (
        <div className="flex" data-cy-header="userDropdown">
            <UserDropdownButton {...rest} user={user} buttonRef={anchorRef} isOpen={isOpen} onClick={toggle} />
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
                                        <div className="opacity-50 small m0">{c('Label').t`Organization`}</div>
                                        <div className="mb1">{organizationName}</div>
                                    </>
                                ) : null}
                                <div className="opacity-50 small m0">{c('Label').t`Storage space`}</div>
                                <div className="flex flex-items-baseline flex-nowrap flex-spacebetween">
                                    <span>
                                        <span className="semibold">{humanSize(UsedSpace)} </span>
                                        /&nbsp;{humanSize(MaxSpace)}
                                    </span>
                                    {canAddStorage ? (
                                        <AppLink
                                            to="/subscription"
                                            toApp={getAccountSettingsApp()}
                                            className="small link m0 ml0-5"
                                            title={c('Apps dropdown').t`Add storage space`}
                                            onClick={() => close()}
                                        >
                                            {c('Action').t`Add storage`}
                                        </AppLink>
                                    ) : null}
                                </div>
                                <Meter className="is-thin bl mt0-5 mb1" value={spacePercentage} />
                                <AppLink
                                    to="/"
                                    className="bl w100 mt1-5 mb1-5 aligncenter pm-button pm-button--primaryborder"
                                    toApp={getAccountSettingsApp()}
                                    onClick={() => close()}
                                >
                                    {c('Action').t`Manage account`}
                                </AppLink>
                            </li>
                            <li className="dropDown-item-hr mt0-5 mb0-5" aria-hidden="false" />
                        </>
                    ) : null}
                    {isSSOMode ? (
                        <li>
                            <button
                                type="button"
                                className="w100 flex underline-hover dropDown-item-link pl1 pr1 pt0-5 pb0-5 alignleft"
                                onClick={handleSwitchAccount}
                            >
                                <Icon className="mt0-25 mr0-5" name="organization-users" />
                                {c('Action').t`Switch account`}
                            </button>
                        </li>
                    ) : null}
                    <li>
                        <a
                            className="w100 flex flex-nowrap dropDown-item-link nodecoration pl1 pr1 pt0-5 pb0-5"
                            href="https://shop.protonmail.com"
                            // eslint-disable-next-line react/jsx-no-target-blank
                            target="_blank"
                            onClick={() => close()}
                        >
                            <Icon className="mt0-25 mr0-5" name="shop" />
                            {c('Action').t`Proton shop`}
                        </a>
                    </li>
                    {canPay && !isSubUser ? (
                        <li>
                            <button
                                type="button"
                                className="w100 flex underline-hover dropDown-item-link pl1 pr1 pt0-5 pb0-5 alignleft"
                                onClick={handleSupportUsClick}
                            >
                                <Icon className="mt0-25 mr0-5" name="donate" />
                                {c('Action').t`Support us`}
                            </button>
                        </li>
                    ) : null}
                    <li className="dropDown-item-hr mt0-5" aria-hidden="false" />
                    <li>
                        <div className="pl1 pr1 pt0-5 pb0-5 w100 flex flex-nowrap flex-spacebetween flex-items-center">
                            <label htmlFor="theme-toggle" className="mr1">{c('Action').t`Display mode`}</label>
                            <Toggle
                                id="theme-toggle"
                                className="pm-toggle-label--theme-toggle"
                                title={c('Title').t`Toggle display mode`}
                                checked={userSettings.ThemeType === ThemeTypes.Dark}
                                loading={loading}
                                onChange={() => withLoading(handleThemeToggle())}
                                label={(key: ToggleState) => {
                                    const alt =
                                        key === ToggleState.on
                                            ? c('Toggle button').t`Normal`
                                            : c('Toggle button').t`Dark`;
                                    return (
                                        <span className="pm-toggle-label-text">
                                            <Icon
                                                name={key === ToggleState.on ? 'crescent-moon' : 'half-moon'}
                                                alt={alt}
                                                className="pm-toggle-label-img"
                                            />
                                        </span>
                                    );
                                }}
                            />
                        </div>
                    </li>
                    <li className="dropDown-item-hr mb0-5" aria-hidden="false" />
                    <li className="pt0-5 pb0-5 pl1 pr1 flex">
                        <PrimaryButton
                            className="w100 aligncenter navigationUser-logout"
                            onClick={handleLogout}
                            data-cy-header-user-dropdown="logout"
                        >
                            {c('Action').t`Sign out`}
                        </PrimaryButton>
                    </li>
                </ul>
            </Dropdown>
        </div>
    );
};

export default UserDropdown;
