import { useEffect, useState } from 'react';
import { addDays, fromUnixTime } from 'date-fns';
import { useLocation } from 'react-router';
import { c } from 'ttag';
import { APPS, BRAND_NAME, APP_NAMES, isSSOMode, PLAN_SERVICES, SSO_PATHS } from '@proton/shared/lib/constants';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { requestFork } from '@proton/shared/lib/authentication/sessionForking';
import { FORK_TYPE } from '@proton/shared/lib/authentication/ForkInterface';
import { getPlanName, hasLifetime } from '@proton/shared/lib/helpers/subscription';
import { getAppFromPathnameSafe, getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import {
    usePopperAnchor,
    Dropdown,
    Icon,
    DropdownMenu,
    DropdownMenuButton,
    Button,
    SimpleDropdown,
    SettingsLink,
    DropdownMenuLink,
    NotificationDot,
    Copy,
    useAuthentication,
    useConfig,
    useModals,
    useNotifications,
    useOrganization,
    useRecoveryNotification,
    useSubscription,
    useUser,
    useUserSettings,
    useFeature,
    useSpotlightOnFeature,
    FeatureCode,
    ReferralSpotlight,
    useModalState,
} from '@proton/components';

import { classnames, generateUID } from '../../helpers';
import UserDropdownButton, { Props as UserDropdownButtonProps } from './UserDropdownButton';
import { OnboardingModal } from '../onboarding';
import { AuthenticatedBugModal } from '../support';

interface Props extends Omit<UserDropdownButtonProps, 'user' | 'isOpen' | 'onClick'> {
    onOpenChat?: () => void;
}

const UserDropdown = ({ onOpenChat, ...rest }: Props) => {
    const { APP_NAME } = useConfig();
    const [organization] = useOrganization();
    const { Name: organizationName } = organization || {};
    const [user] = useUser();
    const location = useLocation();
    const [subscription] = useSubscription();
    const [userSettings] = useUserSettings();
    const [redDotReferral, setRedDotReferral] = useState(false);
    const { Email, DisplayName, Name } = user;
    const nameToDisplay = DisplayName || Name; // nameToDisplay can be falsy for external account
    const { logout } = useAuthentication();
    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const { createModal } = useModals();
    const [bugReportModal, setBugReportModal, render] = useModalState();

    const recoveryNotification = useRecoveryNotification(true);
    const { feature: referralProgramFeature } = useFeature(FeatureCode.ReferralProgram);

    const subscriptionStartedThirtyDaysAgo =
        !!subscription?.PeriodStart && new Date() > addDays(fromUnixTime(subscription.PeriodStart), 30);
    const {
        show: showSpotlight,
        onDisplayed: onDisplayedSpotlight,
        onClose: onCloseSpotlight,
    } = useSpotlightOnFeature(
        FeatureCode.ReferralProgramSpotlight,
        !!referralProgramFeature?.Value && !!userSettings?.Referral?.Eligible && subscriptionStartedThirtyDaysAgo
    );
    const { createNotification } = useNotifications();
    const handleCopyEmail = () => {
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
        setBugReportModal(true);
    };

    const userVoiceLinks: Partial<{ [key in APP_NAMES]: string }> = {
        [APPS.PROTONMAIL]: 'https://protonmail.uservoice.com/',
        [APPS.PROTONCALENDAR]: 'https://protonmail.uservoice.com/forums/932842-proton-calendar',
        [APPS.PROTONDRIVE]: 'https://protonmail.uservoice.com/forums/932839-proton-drive',
        [APPS.PROTONVPN_SETTINGS]: 'https://protonmail.uservoice.com/forums/932836-protonvpn',
    };

    // Show referral dot if the spotlight has been displayed
    useEffect(() => {
        if (showSpotlight) {
            setRedDotReferral(true);
        }
    }, [showSpotlight, location]);

    // Hide red dot referral if user has already seen referral page
    useEffect(() => {
        if (location.pathname.includes('/referral')) {
            setRedDotReferral(false);
        }
    }, [location.pathname]);

    return (
        <>
            {render && <AuthenticatedBugModal {...bugReportModal} />}
            <ReferralSpotlight
                show={showSpotlight}
                anchorRef={anchorRef}
                onDisplayed={onDisplayedSpotlight}
                onClose={onCloseSpotlight}
            >
                <UserDropdownButton
                    data-testid="heading:userdropdown"
                    {...rest}
                    user={user}
                    ref={anchorRef}
                    isOpen={isOpen}
                    onClick={() => {
                        onCloseSpotlight();
                        toggle();
                    }}
                    notification={recoveryNotification?.color}
                />
            </ReferralSpotlight>
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
                    <div className="px1 py0-5">
                        {organizationName && APP_NAME !== APPS.PROTONVPN_SETTINGS ? (
                            <div
                                className="text-ellipsis-two-lines text-bold"
                                title={organizationName}
                                data-testid="userdropdown:label:org-name"
                            >
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
                                data-testid="userdropdown:label:display-name"
                            >
                                {nameToDisplay}
                            </div>
                        ) : null}

                        {Email ? (
                            <div className="flex flex-nowrap flex-justify-space-between flex-align-items-center opacity-on-hover-container">
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
                                    data-testid="userdropdown:label:email"
                                >
                                    {Email}
                                </span>
                                <Copy
                                    value={Email}
                                    className="mr-6p opacity-on-hover"
                                    onCopy={handleCopyEmail}
                                    tooltipText={c('Action').t`Copy email to clipboard`}
                                    size="small"
                                    shape="ghost"
                                    data-testid="userdropdown:button:copy-email"
                                />
                            </div>
                        ) : null}

                        {planName ? (
                            <div className="pt0-25">
                                <span className="badge-label-primary" data-testid="userdropdown:label:plan-name">
                                    {planName}
                                </span>
                            </div>
                        ) : null}
                    </div>

                    {recoveryNotification && (
                        <>
                            <hr className="mt0-5 mb0-5" />
                            <DropdownMenuLink
                                as={SettingsLink}
                                className="text-left flex flex-nowrap flex-justify-space-between flex-align-items-center"
                                path={recoveryNotification.path}
                                onClick={close}
                            >
                                {recoveryNotification.text}
                                <NotificationDot color={recoveryNotification.color} />
                            </DropdownMenuLink>
                        </>
                    )}

                    <hr className="mt0-5 mb0-5" />

                    {APP_NAME !== APPS.PROTONVPN_SETTINGS && (
                        <DropdownMenuButton
                            className="text-left"
                            onClick={handleTourClick}
                            data-testid="userdropdown:button:introduction"
                        >
                            {c('Action').t`${BRAND_NAME} introduction`}
                        </DropdownMenuButton>
                    )}

                    {APP_NAME !== APPS.PROTONVPN_SETTINGS &&
                        referralProgramFeature?.Value &&
                        userSettings?.Referral?.Eligible && (
                            <DropdownMenuLink
                                as={SettingsLink}
                                className="text-left flex flex-nowrap flex-justify-space-between flex-align-items-center"
                                path="/referral"
                                onClick={close}
                                data-testid="userdropdown:button:referral"
                            >
                                {c('Action').t`Refer a friend`}
                                {redDotReferral ? <NotificationDot color="danger" /> : <span />}
                            </DropdownMenuLink>
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
                                <span className="flex on-rtl-mirror ml1">
                                    <Icon className="rotateZ-270" name="angle-down" />
                                </span>
                            </span>
                        }
                        data-testid="userdropdown:button:help"
                    >
                        <DropdownMenu>
                            {onOpenChat && (
                                <DropdownMenuButton
                                    className="text-left"
                                    onClick={() => {
                                        close();
                                        onOpenChat();
                                    }}
                                >
                                    {c('Action').t`Chat with us`}
                                </DropdownMenuButton>
                            )}
                            <DropdownMenuLink
                                className="text-left"
                                href={
                                    APP_NAME === PROTONVPN_SETTINGS
                                        ? 'https://protonvpn.com/support/'
                                        : 'https://protonmail.com/support/'
                                }
                                // eslint-disable-next-line react/jsx-no-target-blank
                                target="_blank"
                                data-testid="userdropdown:help:link:question"
                            >
                                {c('Action').t`I have a question`}
                            </DropdownMenuLink>

                            <DropdownMenuLink
                                className="text-left"
                                href={userVoiceLinks[APP_NAME] || userVoiceLinks[APPS.PROTONMAIL]}
                                target="_blank"
                                data-testid="userdropdown:help:link:request-feature"
                            >
                                {c('Action').t`Request a feature`}
                            </DropdownMenuLink>

                            <DropdownMenuButton
                                className="text-left"
                                onClick={handleBugReportClick}
                                data-testid="userdropdown:help:button:bugreport"
                            >
                                {c('Action').t`Report a problem`}
                            </DropdownMenuButton>
                        </DropdownMenu>
                    </SimpleDropdown>

                    <DropdownMenuLink
                        className="text-left flex flex-nowrap flex-justify-space-between flex-align-items-center"
                        href="https://shop.protonmail.com"
                        target="_blank"
                        data-testid="userdropdown:link:shop"
                    >
                        {c('Action').t`${BRAND_NAME} shop`}
                        <Icon className="ml1 on-rtl-mirror" name="arrow-up-right-from-square" />
                    </DropdownMenuLink>

                    <hr className="my0-5" />

                    {isSSOMode ? (
                        <div className="px1 pt0-5 pb0-75">
                            <Button
                                shape="outline"
                                color="weak"
                                className="w100"
                                onClick={handleSwitchAccount}
                                data-testid="userdropdown:button:switch-account"
                            >
                                {c('Action').t`Switch account`}
                            </Button>
                        </div>
                    ) : null}

                    <div className="px1 pb0-75">
                        <Button
                            shape="solid"
                            color="norm"
                            className="w100"
                            onClick={handleLogout}
                            data-testid="userdropdown:button:logout"
                        >
                            {c('Action').t`Sign out`}
                        </Button>
                    </div>
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

export default UserDropdown;
