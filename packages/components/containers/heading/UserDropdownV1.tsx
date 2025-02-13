import type { MouseEvent } from 'react';
import { useContext, useState } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike, NotificationDot } from '@proton/atoms';
import { ThemeColor } from '@proton/colors/types';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import Icon from '@proton/components/components/icon/Icon';
import AppLink from '@proton/components/components/link/AppLink';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import Tooltip from '@proton/components/components/tooltip/Tooltip';
import AccountSessionsSwitcher from '@proton/components/containers/heading/AccountSessionsSwitcher';
import { AppSwitcher } from '@proton/components/containers/heading/AppSwitcher';
import { SchedulePhoneCall } from '@proton/components/containers/heading/SchedulePhoneCall';
import { SecurityCheckup } from '@proton/components/containers/heading/SecurityCheckup';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import useConfig from '@proton/components/hooks/useConfig';
import useNotifications from '@proton/components/hooks/useNotifications';
import { ForkType } from '@proton/shared/lib/authentication/fork';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { getShopURL, getStaticURL } from '@proton/shared/lib/helpers/url';
import clsx from '@proton/utils/clsx';
import generateUID from '@proton/utils/generateUID';

import { UserDropdownContext } from './UserDropdownContext';

import './UserDropdownV1.scss';

const UserDropdownV1 = () => {
    const { APP_NAME } = useConfig();
    const [uid] = useState(generateUID('dropdown'));
    const {
        info,
        upgrade,
        referral,
        onSignOut,
        onOpenBugReportModal,
        onOpenSignoutAll,
        accountSessions,
        switchHref,
        loginHref,
        onSwitchAccount,
        app,
        isOpen,
        anchorRef,
        onOpenChat,
        sessionOptions,
        hasAppLinks,
        showSwitchAccountButton,
        closeUserDropdown,
    } = useContext(UserDropdownContext);

    const { createNotification } = useNotifications();
    const handleCopyEmail = () => {
        textToClipboard(info.email);
        createNotification({
            type: 'success',
            text: c('Success').t`Email address copied to clipboard`,
        });
    };

    const userVoiceLinks: Partial<{ [key in APP_NAMES]: string }> = {
        [APPS.PROTONMAIL]: 'https://protonmail.uservoice.com/',
        [APPS.PROTONCALENDAR]: 'https://protonmail.uservoice.com/forums/932842-proton-calendar',
        [APPS.PROTONDRIVE]: 'https://protonmail.uservoice.com/forums/932839-proton-drive',
        [APPS.PROTONVPN_SETTINGS]: 'https://protonmail.uservoice.com/forums/932836-protonvpn',
    };

    const addAccountButton = (
        <ButtonLike
            as="a"
            href={loginHref}
            shape="outline"
            color="weak"
            className="w-full"
            target="_blank"
            onClick={(event) => onSwitchAccount(event, ForkType.LOGIN)}
            data-testid="userdropdown:button:add-account"
        >
            {c('Action').t`Add account`}
        </ButtonLike>
    );

    const switchAccountButton = (
        <ButtonLike
            as="a"
            href={switchHref}
            target="_self"
            shape="outline"
            color="weak"
            className="w-full"
            onClick={(event: MouseEvent<HTMLAnchorElement>) => onSwitchAccount(event, ForkType.SWITCH)}
            data-testid="userdropdown:button:switch-account"
        >
            {c('Action').t`Switch or add account`}
        </ButtonLike>
    );

    const { viewportWidth } = useActiveBreakpoint();
    // DisplayName is null for VPN users without any addresses, cast to undefined in case Name would be null too.

    return (
        <>
            <Dropdown
                id={uid}
                className="userDropdownV1"
                isOpen={isOpen}
                anchorRef={anchorRef}
                autoClose={false}
                onClose={closeUserDropdown}
                originalPlacement="bottom-end"
                adaptiveForTouchScreens={false}
                size={{
                    height: DropdownSizeUnit.Dynamic,
                    maxHeight: DropdownSizeUnit.Viewport,
                    width: '17.25rem',
                    maxWidth: '20rem',
                }}
            >
                <div className="pb-4">
                    <div className="px-4 py-3 flex flex-nowrap gap-4 justify-space-between text-sm">
                        {info.planName ? (
                            <span className="text-semibold block shrink-0" data-testid="userdropdown:label:plan-name">
                                {info.planName}
                            </span>
                        ) : null}

                        {info.organizationName ? (
                            <span
                                className="ml-auto text-ellipsis color-weak block"
                                title={info.organizationName}
                                data-testid="userdropdown:label:org-name"
                            >
                                {info.organizationName}
                            </span>
                        ) : null}

                        {upgrade.display ? (
                            <SettingsLink
                                className="text-ellipsis"
                                path={upgrade.url}
                                title={c('specialoffer: Link').t`Go to subscription plans`}
                            >{c('specialoffer: Link').t`Upgrade`}</SettingsLink>
                        ) : null}
                    </div>

                    {!viewportWidth['<=small'] && (
                        <div className="px-4 pb-4 text-sm flex flex-nowrap items-center">
                            <span
                                className="my-auto text-sm rounded border p-1 inline-block relative flex shrink-0 user-initials"
                                aria-hidden="true"
                            >
                                <span className="m-auto">{info.initials}</span>
                            </span>
                            <div className="flex-1 ml-2">
                                {info.name ? (
                                    <div
                                        className="text-ellipsis"
                                        title={info.name}
                                        data-testid="userdropdown:label:display-name"
                                    >
                                        {info.name}
                                    </div>
                                ) : null}

                                {info.email ? (
                                    <div className="flex flex-nowrap justify-space-between items-center">
                                        <Tooltip title={c('Action').t`Copy address`} openDelay={250}>
                                            <button
                                                type="button"
                                                className={clsx([
                                                    'user-select relative interactive-pseudo-protrude interactive--no-background',
                                                    info.name || info.organizationName ? 'color-weak' : 'text-bold',
                                                ])}
                                                title={info.email}
                                                data-testid="userdropdown:label:email"
                                                onClick={handleCopyEmail}
                                            >
                                                <span className="text-ellipsis block color-weak hover:color-norm">
                                                    {info.email}
                                                </span>
                                            </button>
                                        </Tooltip>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    )}

                    <SecurityCheckup>
                        {(props) => {
                            return (
                                <AppLink
                                    {...props}
                                    className={clsx(
                                        'recommended-actions',
                                        'button button-no-hover',
                                        'mx-4 mb-4 rounded p-3 flex flex-nowrap items-center gap-3 text-sm text-left'
                                    )}
                                >
                                    <Icon className="shrink-0" name="pass-shield-ok" size={6} />

                                    <div>{c('Safety review').t`Review account safety`}</div>
                                </AppLink>
                            );
                        }}
                    </SecurityCheckup>

                    <div className="mb-4 mx-4 flex flex-column gap-2">
                        {showSwitchAccountButton && !accountSessions.hasList
                            ? accountSessions.hasAddAccount
                                ? addAccountButton
                                : switchAccountButton
                            : null}

                        {APP_NAME !== APPS.PROTONACCOUNT && APP_NAME !== APPS.PROTONVPN_SETTINGS ? (
                            <ButtonLike
                                as={SettingsLink}
                                shape="outline"
                                color="weak"
                                className="w-full"
                                path="/"
                                data-testid="userdropdown:button:settings"
                            >{c('Action').t`Settings`}</ButtonLike>
                        ) : undefined}

                        <Button
                            shape="solid"
                            color="norm"
                            className="w-full"
                            onClick={onSignOut}
                            data-testid="userdropdown:button:logout"
                        >
                            {c('Action').t`Sign out`}
                        </Button>
                    </div>

                    {showSwitchAccountButton && accountSessions.hasList && (
                        <div className="mb-4">
                            <AccountSessionsSwitcher
                                sessionOptions={sessionOptions}
                                sessions={accountSessions.state.value}
                                onSignOut={() => {
                                    closeUserDropdown();
                                    onOpenSignoutAll();
                                }}
                            />
                            <div className="mx-4 my-2">{addAccountButton}</div>
                        </div>
                    )}

                    {hasAppLinks && <AppSwitcher app={app} hasBorder={accountSessions.hasList} />}

                    <div className="text-sm text-center flex flex-column gap-2">
                        {referral.visible && (
                            <div className="block">
                                <div className="block">
                                    <SettingsLink
                                        className="mx-auto w-full px-2 link link-focus color-weak text-no-decoration hover:color-norm"
                                        path="/referral"
                                        onClick={closeUserDropdown}
                                        data-testid="userdropdown:button:referral"
                                    >
                                        {c('Action').t`Refer a friend`}
                                        {referral.redDotReferral ? (
                                            <NotificationDot color={ThemeColor.Danger} />
                                        ) : (
                                            <span />
                                        )}
                                    </SettingsLink>
                                </div>
                            </div>
                        )}

                        <div className="block">
                            <a
                                className="mx-auto w-full px-2 link link-focus color-weak text-no-decoration hover:color-norm"
                                href={getShopURL()}
                                target="_blank"
                                data-testid="userdropdown:help:link:request-feature"
                            >
                                {c('Action').t`${BRAND_NAME} shop`}
                            </a>
                        </div>

                        <SchedulePhoneCall />

                        <div className="block">
                            <a
                                className="mx-auto w-full px-2 link link-focus color-weak text-no-decoration hover:color-norm"
                                href={userVoiceLinks[APP_NAME] || userVoiceLinks[APPS.PROTONMAIL]}
                                target="_blank"
                                data-testid="userdropdown:help:link:request-feature"
                            >
                                {c('Action').t`Request a feature`}
                            </a>
                        </div>

                        {onOpenChat && (
                            <div className="block">
                                <button
                                    type="button"
                                    className="mx-auto w-full px-2 link link-focus color-weak text-no-decoration hover:color-norm"
                                    onClick={() => {
                                        closeUserDropdown();
                                        onOpenChat();
                                    }}
                                >
                                    {c('Action').t`Chat with us`}
                                </button>
                            </div>
                        )}

                        <div className="flex flex-nowrap mx-auto justify-center">
                            <a
                                className="px-1 link link-focus color-weak text-no-decoration hover:color-norm"
                                href={
                                    APP_NAME === APPS.PROTONVPN_SETTINGS
                                        ? 'https://protonvpn.com/support/'
                                        : getStaticURL('/support')
                                }
                                target="_blank"
                                data-testid="userdropdown:help:link:question"
                            >
                                {c('Action').t`Help`}
                            </a>
                            <span className="self-center color-weak" aria-hidden="true">
                                •
                            </span>
                            <button
                                type="button"
                                className="px-1 link link-focus color-weak text-no-decoration hover:color-norm"
                                onClick={onOpenBugReportModal}
                                data-testid="userdropdown:help:button:bugreport"
                            >
                                {c('Action').t`Report a problem`}
                            </button>
                        </div>
                    </div>
                </div>
            </Dropdown>
        </>
    );
};

export default UserDropdownV1;
