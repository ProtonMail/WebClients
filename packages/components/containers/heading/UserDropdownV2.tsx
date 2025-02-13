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
import { APPS_CONFIGURATION } from '@proton/shared/lib/constants';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { getShopURL } from '@proton/shared/lib/helpers/url';
import clsx from '@proton/utils/clsx';
import generateUID from '@proton/utils/generateUID';

import { useTheme } from '../themes/ThemeProvider';
import { UserDropdownContext, type UserDropdownValue } from './UserDropdownContext';

import './UserDropdownV2.scss';

const UserSection = ({ info, upgrade }: { info: UserDropdownValue['info']; upgrade: UserDropdownValue['upgrade'] }) => {
    const { createNotification } = useNotifications();
    const { viewportWidth } = useActiveBreakpoint();
    const currentTheme = useTheme();
    const { dark } = currentTheme.information;

    const handleCopyEmail = () => {
        textToClipboard(info.email);
        createNotification({
            type: 'success',
            text: c('Success').t`Email address copied to clipboard`,
        });
    };

    if (viewportWidth['<=small']) {
        return (
            <div className="p-4 flex justify-space-between">
                {info.planName ? (
                    <span
                        className="inline-block py-px px-1 text-sm rounded-sm userDropdownV2-planname"
                        data-testid="userdropdown:label:plan-name"
                    >
                        {info.planName}
                    </span>
                ) : null}

                {info.organizationName ? (
                    <span
                        className="text-ellipsis py-px px-1 text-sm block"
                        title={info.organizationName}
                        data-testid="userdropdown:label:org-name"
                    >
                        {info.organizationName}
                    </span>
                ) : null}

                {upgrade.display ? (
                    <SettingsLink
                        className="text-ellipsis text-sm py-px px-1 link link-focus"
                        path={upgrade.url}
                        title={c('specialoffer: Link').t`Go to subscription plans`}
                    >{c('specialoffer: Link').t`Upgrade`}</SettingsLink>
                ) : null}
            </div>
        );
    }

    return (
        <div className={clsx('p-4', dark && 'userDropdownV2-theme-dark')}>
            <div className="flex justify-center items-center flex-column">
                <span
                    className="my-auto mb-2 text-sm rounded-xl border p-4 inline-block relative flex shrink-0 user-initials user-initials-active w-custom ratio-square text-2xl"
                    style={{ '--w-custom': '4rem' }}
                    aria-hidden="true"
                >
                    <span className="m-auto">{info.initials}</span>
                </span>
                <div className="text-center mb-2 w-full">
                    {info.name ? (
                        <div className="text-ellipsis" title={info.name} data-testid="userdropdown:label:display-name">
                            {info.name}
                        </div>
                    ) : null}

                    {info.email ? (
                        <div className="flex flex-nowrap justify-center items-center">
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
            <div className="flex flex-column gap-1 text-center empty:hidden">
                {info.organizationName ? (
                    <span
                        className="text-ellipsis text-sm block"
                        title={info.organizationName}
                        data-testid="userdropdown:label:org-name"
                    >
                        {info.organizationName}
                    </span>
                ) : null}

                <div className="flex justify-center gap-2">
                    {info.planName ? (
                        <span
                            className="inline-block py-px px-1 text-sm rounded-sm userDropdownV2-planname"
                            data-testid="userdropdown:label:plan-name"
                        >
                            {info.planName}
                        </span>
                    ) : null}

                    {upgrade.display ? (
                        <SettingsLink
                            className="text-ellipsis text-sm py-px px-1 link link-focus"
                            path={upgrade.url}
                            title={c('specialoffer: Link').t`Go to subscription plans`}
                        >{c('specialoffer: Link').t`Upgrade`}</SettingsLink>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

const AddAccountButton = ({
    showAsButton = false,
    className,
    copy = () => c('Action').t`Add account`,
}: {
    showAsButton?: boolean;
    className?: string;
    copy?: () => string;
}) => {
    const { loginHref, onSwitchAccount } = useContext(UserDropdownContext);

    const commonProps = {
        href: loginHref,
        target: '_blank',
        onClick: (event: MouseEvent<HTMLAnchorElement>) => onSwitchAccount(event, ForkType.LOGIN),
        'data-testid': 'userdropdown:button:add-account',
    };

    if (showAsButton) {
        return (
            <ButtonLike as="a" shape="outline" color="weak" fullWidth className={clsx(className)} {...commonProps}>
                {copy()}
            </ButtonLike>
        );
    }

    return (
        <a
            className={clsx(
                'text-no-decoration w-full relative',
                'interactive-pseudo-inset py-2',
                'hover:color-norm inline-flex items-center',
                className
            )}
            {...commonProps}
        >
            <Icon name="plus" className="shrink-0" />
            {copy()}
        </a>
    );
};

const SwitchAccountButton = () => {
    const { switchHref, onSwitchAccount } = useContext(UserDropdownContext);
    return (
        <ButtonLike
            as="a"
            href={switchHref}
            target="_self"
            shape="outline"
            color="weak"
            fullWidth
            onClick={(event: MouseEvent<HTMLAnchorElement>) => onSwitchAccount(event, ForkType.SWITCH)}
            data-testid="userdropdown:button:switch-account"
        >
            {c('Action').t`Switch or add account`}
        </ButtonLike>
    );
};

export const UserDropdownV2 = () => {
    const { APP_NAME } = useConfig();
    const [uid] = useState(generateUID('dropdown'));
    const { viewportWidth } = useActiveBreakpoint();
    const {
        info,
        closeUserDropdown,
        referral,
        onSignOut,
        onOpenSignoutAll,
        isOpen,
        app,
        anchorRef,
        accountSessions,
        hasAppLinks,
        onOpenChat,
        showSwitchAccountButton,
        sessionOptions,
        onOpenHelpModal,
        upgrade,
    } = useContext(UserDropdownContext);

    const showSettingsButton =
        viewportWidth['<=small'] && APP_NAME !== APPS.PROTONACCOUNT && APP_NAME !== APPS.PROTONVPN_SETTINGS;

    return (
        <Dropdown
            id={uid}
            className="userDropdownV2 rounded-lg overflow-hidden"
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
            <SecurityCheckup>
                {(props) => {
                    return (
                        <AppLink
                            {...props}
                            className={clsx(
                                'recommended-actions',
                                'interactive-pseudo-inset',
                                'relative p-2 flex flex-nowrap items-center justify-center gap-2 text-sm'
                            )}
                        >
                            <Icon className="shrink-0" name="pass-shield-ok" size={6} />
                            <div>{c('Safety review').t`Review account safety`}</div>
                            <Icon className="shrink-0" name="chevron-right" size={4} />
                        </AppLink>
                    );
                }}
            </SecurityCheckup>

            <div className="pb-4">
                <UserSection info={info} upgrade={upgrade} />

                <div className="mb-4 px-4 flex flex-column gap-2">
                    {showSwitchAccountButton && !accountSessions.hasList ? (
                        accountSessions.hasAddAccount ? (
                            <AddAccountButton showAsButton copy={() => c('Action').t`Add another account`} />
                        ) : (
                            <SwitchAccountButton />
                        )
                    ) : null}

                    {showSettingsButton ? (
                        <ButtonLike
                            as={SettingsLink}
                            shape="outline"
                            color="weak"
                            fullWidth
                            path={APPS_CONFIGURATION[APP_NAME].publicPath}
                            data-testid="userdropdown:button:settings"
                        >{c('Action').t`Settings`}</ButtonLike>
                    ) : undefined}

                    <Button
                        shape="outline"
                        color={
                            (showSwitchAccountButton && !accountSessions.hasList) || showSettingsButton
                                ? 'norm'
                                : 'weak'
                        }
                        fullWidth
                        onClick={onSignOut}
                        data-testid="userdropdown:button:logout"
                    >
                        {c('Action').t`Sign out`}
                    </Button>
                </div>

                {showSwitchAccountButton && accountSessions.hasList && (
                    <div className={clsx('mb-4', !viewportWidth['<=small'] && 'pb-4 border-bottom')}>
                        <AccountSessionsSwitcher
                            sessionOptions={sessionOptions}
                            sessions={accountSessions.state.value}
                            onSignOut={() => {
                                closeUserDropdown();
                                onOpenSignoutAll();
                            }}
                            addAccountButton={<AddAccountButton className="pl-5 pr-4 gap-4" />}
                            addAccountButtonDropdown={<AddAccountButton className="px-4 gap-2" />}
                        />
                    </div>
                )}

                {hasAppLinks && <AppSwitcher app={app} hasBorder={accountSessions.hasList} />}

                <div className="text-sm text-center flex flex-column gap-2">
                    <div className="block">
                        <button
                            type="button"
                            className="px-1 link link-focus color-weak text-no-decoration hover:color-norm"
                            onClick={() => onOpenHelpModal()}
                            data-testid="userdropdown:help:button:help-and-feedback"
                        >
                            {c('Action').t`Help and feedback`}
                        </button>
                    </div>

                    <SchedulePhoneCall />

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

                    <div className="flex justify-center">
                        {referral.visible && (
                            <>
                                <SettingsLink
                                    className="px-2 link link-focus color-weak text-no-decoration hover:color-norm"
                                    path="/referral"
                                    onClick={closeUserDropdown}
                                    data-testid="userdropdown:button:referral"
                                >
                                    {c('Action').t`Refer a friend`}
                                    {referral.redDotReferral ? <NotificationDot color={ThemeColor.Danger} /> : <span />}
                                </SettingsLink>
                                <span className="self-center color-weak" aria-hidden="true">
                                    •
                                </span>
                            </>
                        )}
                        <a
                            className="px-2 link link-focus color-weak text-no-decoration hover:color-norm"
                            href={getShopURL()}
                            target="_blank"
                            data-testid="userdropdown:help:link:request-feature"
                        >
                            {c('Action').t`${BRAND_NAME} shop`}
                        </a>
                    </div>
                </div>
            </div>
        </Dropdown>
    );
};

export default UserDropdownV2;
