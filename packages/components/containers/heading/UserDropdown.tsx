import { useState, MouseEvent } from 'react';
import { c } from 'ttag';
import { APPS, BRAND_NAME, APP_NAMES, isSSOMode, PLAN_SERVICES, SSO_PATHS } from '@proton/shared/lib/constants';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { requestFork } from '@proton/shared/lib/authentication/sessionForking';
import { FORK_TYPE } from '@proton/shared/lib/authentication/ForkInterface';
import { getPlanName, hasLifetime } from '@proton/shared/lib/helpers/subscription';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { getAppFromPathnameSafe, getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';

import {
    useAuthentication,
    useConfig,
    useUser,
    useOrganization,
    useSubscription,
    useNotifications,
    useModals,
} from '../../hooks';
import {
    usePopperAnchor,
    Dropdown,
    Icon,
    DropdownMenu,
    DropdownMenuButton,
    Tooltip,
    Button,
    SimpleDropdown,
    DropdownMenuLink,
} from '../../components';
import { classnames, generateUID } from '../../helpers';
import UserDropdownButton, { Props } from './UserDropdownButton';
import { OnboardingModal } from '../onboarding';
import { AuthenticatedBugModal, BugModal } from '../support';

const UserDropdown = (rest: Omit<Props, 'user' | 'isOpen' | 'onClick'>) => {
    const { UID } = useAuthentication();
    const isAuthenticated = !!UID;
    const { APP_NAME } = useConfig();
    const [organization] = useOrganization();
    const { Name: organizationName } = organization || {};
    const [user] = useUser();
    const { Email, DisplayName, Name } = user;
    const nameToDisplay = DisplayName || Name; // nameToDisplay can be falsy for external account
    const { logout } = useAuthentication();
    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const { createModal } = useModals();

    const { createNotification } = useNotifications();
    const handleCopyEmail = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        textToClipboard(Email, e.currentTarget);
        createNotification({
            type: 'success',
            text: c('Success').t`Email address copied to clipboard`,
        });
    };

    const handleSwitchAccount = () => {
        if (APP_NAME === APPS.PROTONACCOUNT) {
            const href = getAppHref(SSO_PATHS.SWITCH, APPS.PROTONACCOUNT);
            const settingsApp = getAppFromPathnameSafe(window.location.pathname);
            const settingsSlug = settingsApp ? getSlugFromApp(settingsApp) : undefined;
            const searchParams = settingsSlug ? `?service=${settingsSlug}` : '';
            return document.location.assign(`${href}${searchParams}`);
        }
        return requestFork(APP_NAME, undefined, FORK_TYPE.SWITCH);
    };

    const handleLogout = () => {
        logout();
        close();
    };

    const { MAIL, VPN } = PLAN_SERVICES;
    const { PROTONVPN_SETTINGS } = APPS;
    const [subscription] = useSubscription();

    let planName;

    if (subscription) {
        if (hasLifetime(subscription)) {
            planName = 'Lifetime';
        } else {
            planName = getPlanName(subscription, MAIL) || getPlanName(subscription, VPN);
        }

        if (APP_NAME === PROTONVPN_SETTINGS) {
            planName = getPlanName(subscription, VPN);
        }
    }

    const handleTourClick = () => {
        createModal(<OnboardingModal showGenericSteps allowClose hideDisplayName />);
    };

    const handleBugReportClick = () => {
        createModal(isAuthenticated ? <AuthenticatedBugModal /> : <BugModal />);
    };

    const userVoiceLinks: Partial<{ [key in APP_NAMES]: string }> = {
        [APPS.PROTONMAIL]: 'https://protonmail.uservoice.com/',
        [APPS.PROTONCALENDAR]: 'https://protonmail.uservoice.com/forums/932842-proton-calendar',
        [APPS.PROTONDRIVE]: 'https://protonmail.uservoice.com/forums/932839-proton-drive',
        [APPS.PROTONVPN_SETTINGS]: 'https://protonmail.uservoice.com/forums/932836-protonvpn',
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
                style={{ '--min-width': '18em', '--max-width': '30em' }}
                isOpen={isOpen}
                noMaxSize
                anchorRef={anchorRef}
                autoClose={false}
                onClose={close}
                originalPlacement="bottom-right"
            >
                <DropdownMenu>
                    <div className="pr1 pl1 pt0-25 pb0-25">
                        {organizationName && APP_NAME !== APPS.PROTONVPN_SETTINGS ? (
                            <div className="text-ellipsis-two-lines text-bold" title={organizationName}>
                                {organizationName}
                            </div>
                        ) : null}

                        {nameToDisplay ? (
                            <div
                                className={classnames([
                                    'text-ellipsis-two-lines',
                                    (!organizationName || APP_NAME === APPS.PROTONVPN_SETTINGS) && 'text-bold',
                                ])}
                                title={nameToDisplay}
                            >
                                {nameToDisplay}
                            </div>
                        ) : null}

                        {Email ? (
                            <div className="flex flex-nowrap flex-justify-space-between flex-align-items-center button-show-on-hover">
                                <span
                                    className={classnames([
                                        'text-ellipsis user-select',
                                        !nameToDisplay &&
                                            (!organizationName || APP_NAME === APPS.PROTONVPN_SETTINGS) &&
                                            'text-bold',
                                        (nameToDisplay || (organizationName && APP_NAME !== APPS.PROTONVPN_SETTINGS)) &&
                                            'color-weak',
                                    ])}
                                    title={Email}
                                >
                                    {Email}
                                </span>
                                <Tooltip title={c('Action').t`Copy email to clipboard`}>
                                    <Button
                                        className="flex-item-noshrink ml1 mr-6p button-show-on-hover-element"
                                        icon
                                        shape="ghost"
                                        color="weak"
                                        size="small"
                                        onClick={handleCopyEmail}
                                    >
                                        <Icon name="copy" alt={c('Action').t`Copy email to clipboard`} />
                                    </Button>
                                </Tooltip>
                            </div>
                        ) : null}

                        {planName ? (
                            <div className="pt0-25">
                                <span className="badge-label-primary">{planName}</span>
                            </div>
                        ) : null}
                    </div>

                    <hr className="mt0-5 mb0-5" />

                    {APP_NAME !== APPS.PROTONVPN_SETTINGS && (
                        <DropdownMenuButton
                            className="text-left flex flex-nowrap flex-justify-space-between flex-align-items-center"
                            onClick={handleTourClick}
                        >
                            {c('Action').t`${BRAND_NAME} introduction`}
                            <Icon className="ml1" name="presentation" />
                        </DropdownMenuButton>
                    )}

                    <SimpleDropdown
                        as={DropdownMenuButton}
                        originalPlacement="left-top"
                        hasCaret={false}
                        dropdownStyle={{ '--min-width': '15em' }}
                        title={c('Title').t`Open help menu`}
                        content={
                            <span className="flex flex-nowrap flex-justify-space-between flex-align-items-center">
                                {c('Header').t`Get help`}
                                <Icon className="ml1 rotateZ-270" name="caret" />
                            </span>
                        }
                    >
                        <DropdownMenu>
                            <DropdownMenuLink
                                className="text-left flex flex-nowrap flex-justify-space-between flex-align-items-center"
                                href={
                                    APP_NAME === PROTONVPN_SETTINGS
                                        ? 'https://protonvpn.com/support/'
                                        : 'https://protonmail.com/support/'
                                }
                                // eslint-disable-next-line react/jsx-no-target-blank
                                target="_blank"
                            >
                                {c('Action').t`I have a question`}
                                <Icon className="ml1" name="external-link" />
                            </DropdownMenuLink>

                            <DropdownMenuLink
                                className="text-left flex flex-nowrap flex-justify-space-between flex-align-items-center"
                                href={userVoiceLinks[APP_NAME] || userVoiceLinks[APPS.PROTONMAIL]}
                                target="_blank"
                            >
                                {c('Action').t`Request a feature`}
                                <Icon className="ml1" name="external-link" />
                            </DropdownMenuLink>

                            <DropdownMenuButton className="text-left" onClick={handleBugReportClick}>
                                {c('Action').t`Report a problem`}
                            </DropdownMenuButton>
                        </DropdownMenu>
                    </SimpleDropdown>

                    <DropdownMenuLink
                        className="text-left flex flex-nowrap flex-justify-space-between flex-align-items-center"
                        href="https://shop.protonmail.com"
                        target="_blank"
                    >
                        {c('Action').t`${BRAND_NAME} shop`}
                        <Icon className="ml1" name="external-link" />
                    </DropdownMenuLink>

                    <hr className="mt0-5 mb0-5" />

                    {isSSOMode ? (
                        <DropdownMenuButton
                            className="flex flex-nowrap flex-justify-space-between flex-align-items-center"
                            onClick={handleSwitchAccount}
                        >
                            {c('Action').t`Switch account`}
                            <Icon className="ml1" name="account-switch" />
                        </DropdownMenuButton>
                    ) : null}

                    <div className="pr1 pl1 pt0-25 pb0-75">
                        <Button
                            shape="solid"
                            color="norm"
                            className="w100 flex flex-justify-center flex-align-items-center"
                            onClick={handleLogout}
                            data-cy-header-user-dropdown="logout"
                        >
                            <span className="mr0-5">{c('Action').t`Sign out`}</span>
                            <Icon name="sign-out-right" />
                        </Button>
                    </div>
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

export default UserDropdown;
