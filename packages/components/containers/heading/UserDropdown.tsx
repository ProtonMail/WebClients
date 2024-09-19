import type { MouseEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router';

import { addDays, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { signoutAction } from '@proton/account';
import { useGetScheduleCall } from '@proton/account/scheduleCall/hooks';
import { Button, ButtonLike, CircleLoader, NotificationDot } from '@proton/atoms';
import { ThemeColor } from '@proton/colors';
import {
    AppLink,
    ConfirmSignOutModal,
    FeatureCode,
    Logo,
    ReferralSpotlight,
    Tooltip,
    shouldShowConfirmSignOutModal,
    useActiveBreakpoint,
    useAuthentication,
    useConfig,
    useFeature,
    useIsSecurityCheckupAvailable,
    useIsSentinelUser,
    useModalState,
    useNotifications,
    useOrganization,
    usePopperAnchor,
    useSecurityCheckup,
    useSessionRecoveryState,
    useSettingsLink,
    useSpotlightOnFeature,
    useSpotlightShow,
    useSubscription,
    useUser,
    useUserSettings,
} from '@proton/components';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import Icon from '@proton/components/components/icon/Icon';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import { useDispatch } from '@proton/redux-shared-store';
import { getAvailableApps } from '@proton/shared/lib/apps/apps';
import { getAppHref, getAppShortName } from '@proton/shared/lib/apps/helper';
import { getAppFromPathnameSafe, getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { ForkType, requestFork } from '@proton/shared/lib/authentication/fork';
import type { APP_NAMES, PLANS } from '@proton/shared/lib/constants';
import {
    APPS,
    APPS_CONFIGURATION,
    BRAND_NAME,
    PLAN_NAMES,
    SECURITY_CHECKUP_PATHS,
    SHARED_UPSELL_PATHS,
    SSO_PATHS,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { hasInboxDesktopFeature } from '@proton/shared/lib/desktop/ipcHelpers';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { getIsEventModified } from '@proton/shared/lib/helpers/dom';
import { getInitials } from '@proton/shared/lib/helpers/string';
import { getPlan, hasLifetime, isTrial } from '@proton/shared/lib/helpers/subscription';
import { canScheduleOrganizationPhoneCalls, openCalendlyLink } from '@proton/shared/lib/helpers/support';
import { addUpsellPath, getUpgradePath, getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';
import { getShopURL, getStaticURL } from '@proton/shared/lib/helpers/url';
import type { Subscription } from '@proton/shared/lib/interfaces';
import { SessionRecoveryState } from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';
import { useFlag } from '@proton/unleash';
import clsx from '@proton/utils/clsx';
import generateUID from '@proton/utils/generateUID';

import ProductLink from '../../containers/app/ProductLink';
import SessionRecoverySignOutConfirmPrompt from '../account/sessionRecovery/SessionRecoverySignOutConfirmPrompt';
import AuthenticatedBugModal from '../support/AuthenticatedBugModal';
import type { Props as UserDropdownButtonProps } from './UserDropdownButton';
import UserDropdownButton from './UserDropdownButton';

import './UserDropdown.scss';

const getPlanTitle = (subscription: Subscription | undefined) => {
    if (hasLifetime(subscription)) {
        return 'Lifetime';
    }

    return getPlan(subscription)?.Title || PLAN_NAMES[FREE_PLAN.Name as PLANS];
};

interface Props extends Omit<UserDropdownButtonProps, 'user' | 'isOpen' | 'onClick'> {
    onOpenChat?: () => void;
    app: APP_NAMES;
    hasAppLinks?: boolean;
}

const UserDropdown = ({ onOpenChat, app, hasAppLinks = true, dropdownIcon, ...rest }: Props) => {
    const dispatch = useDispatch();
    const { APP_NAME } = useConfig();
    const [organization] = useOrganization();
    const { Name: organizationName } = organization || {};
    const [user] = useUser();
    const location = useLocation();
    const [subscription] = useSubscription();
    const [userSettings] = useUserSettings();
    const authentication = useAuthentication();
    const [redDotReferral, setRedDotReferral] = useState(false);
    const { Email, DisplayName, Name, isMember } = user;
    const nameToDisplay = DisplayName || Name || ''; // nameToDisplay can be falsy for external account
    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const [bugReportModal, setBugReportModal, renderBugReportModal] = useModalState();
    const [confirmSignOutModal, setConfirmSignOutModal, renderConfirmSignOutModal] = useModalState();

    const [{ isSentinelUser }] = useIsSentinelUser();
    const [
        sessionRecoverySignOutConfirmPrompt,
        setSessionRecoverySignOutConfirmPrompt,
        renderSessionRecoverySignOutConfirmPrompt,
    ] = useModalState();

    const getScheduleCall = useGetScheduleCall();

    const isSecurityCheckupAvailable = useIsSecurityCheckupAvailable();
    const securityCheckup = useSecurityCheckup();

    const sessionRecoveryState = useSessionRecoveryState();
    const sessionRecoveryInitiated =
        sessionRecoveryState === SessionRecoveryState.GRACE_PERIOD ||
        sessionRecoveryState === SessionRecoveryState.INSECURE;

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
    const shouldShowSpotlight = useSpotlightShow(showSpotlight, 3000);

    const { createNotification, hideNotification } = useNotifications();
    const handleCopyEmail = () => {
        textToClipboard(Email);
        createNotification({
            type: 'success',
            text: c('Success').t`Email address copied to clipboard`,
        });
    };

    const handleSignout = (clearDeviceRecovery: boolean) => {
        dispatch(signoutAction({ clearDeviceRecovery }));
    };

    const handleSignOutClick = () => {
        close();
        if (sessionRecoveryInitiated) {
            setSessionRecoverySignOutConfirmPrompt(true);
        } else if (shouldShowConfirmSignOutModal({ user, authentication })) {
            setConfirmSignOutModal(true);
        } else {
            handleSignout(false);
        }
    };

    const planName = isMember ? '' : getPlanTitle(subscription);

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
        if (shouldShowSpotlight) {
            setRedDotReferral(true);
        }
    }, [shouldShowSpotlight, location]);

    // Hide red dot referral if user has already seen referral page
    useEffect(() => {
        if (location.pathname.includes('/referral')) {
            setRedDotReferral(false);
        }
    }, [location.pathname]);

    const switchHref = useMemo(() => {
        const href = getAppHref(SSO_PATHS.SWITCH, APPS.PROTONACCOUNT);
        const toApp = APP_NAME === APPS.PROTONACCOUNT ? getAppFromPathnameSafe(location.pathname) : APP_NAME;
        const search = `?product=${getSlugFromApp(toApp || APPS.PROTONMAIL)}`;
        return `${href}${search}`;
    }, [location.pathname]);

    const { viewportWidth } = useActiveBreakpoint();
    // DisplayName is null for VPN users without any addresses, cast to undefined in case Name would be null too.
    const initials = getInitials(nameToDisplay || Email || '');

    const goToSettings = useSettingsLink();
    const path = APPS_CONFIGURATION[APP_NAME].publicPath;

    const upgradePathname = getUpgradePath({ user, subscription, app: APP_NAME });

    const upsellRef = getUpsellRefFromApp({
        app: APP_NAME,
        feature: SHARED_UPSELL_PATHS.USER_DROPDOWN,
        component: UPSELL_COMPONENT.BUTTON,
        fromApp: app,
    });

    const upgradeUrl = addUpsellPath(upgradePathname, upsellRef);
    const displayUpgradeButton = (user.isFree || isTrial(subscription)) && !location.pathname.endsWith(upgradePathname);

    const canSchedulePhoneCalls = canScheduleOrganizationPhoneCalls({ organization, user });

    const inboxDesktopMultiAccountSupport = useFlag('InboxDesktopMultiAccountSupport');
    const showSwitchAccountButton =
        isElectronApp && authentication.mode === 'sso'
            ? inboxDesktopMultiAccountSupport && hasInboxDesktopFeature('MultiAccount')
            : authentication.mode === 'sso';

    const handleScheduleCallClick = async () => {
        close();

        const id = createNotification({
            type: 'info',
            text: (
                <>
                    <CircleLoader size="small" className="mr-4" />
                    {c('Info')
                        .t`Loading calendar, please wait. You will be redirected to our scheduling platform Calendly in a new tab.`}
                </>
            ),
            expiration: -1,
            showCloseButton: false,
        });

        try {
            const { CalendlyLink } = await getScheduleCall();

            openCalendlyLink(CalendlyLink, user);
        } finally {
            hideNotification(id);
        }
    };

    const securityCheckupParams = (() => {
        return new URLSearchParams({
            back: encodeURIComponent(window.location.href),
            source: 'user_dropdown',
            appname: APP_NAME,
        });
    })();

    return (
        <>
            {renderBugReportModal && <AuthenticatedBugModal {...bugReportModal} app={app} />}
            {renderSessionRecoverySignOutConfirmPrompt && (
                <SessionRecoverySignOutConfirmPrompt
                    onSignOut={() => handleSignout(false)}
                    {...sessionRecoverySignOutConfirmPrompt}
                />
            )}
            {renderConfirmSignOutModal && <ConfirmSignOutModal onSignOut={handleSignout} {...confirmSignOutModal} />}
            <ReferralSpotlight
                show={shouldShowSpotlight}
                anchorRef={anchorRef}
                onDisplayed={onDisplayedSpotlight}
                onClose={onCloseSpotlight}
                user={user}
            >
                <UserDropdownButton
                    data-testid="heading:userdropdown"
                    {...rest}
                    user={user}
                    ref={anchorRef}
                    isOpen={isOpen}
                    dropdownIcon={dropdownIcon}
                    onClick={() => {
                        onCloseSpotlight();
                        toggle();
                    }}
                />
            </ReferralSpotlight>
            <Dropdown
                id={uid}
                className="userDropdown"
                isOpen={isOpen}
                anchorRef={anchorRef}
                autoClose={false}
                onClose={close}
                originalPlacement="bottom-end"
                adaptiveForTouchScreens={false}
                size={{
                    height: DropdownSizeUnit.Dynamic,
                    maxHeight: DropdownSizeUnit.Viewport,
                    width: '17.25rem',
                    maxWidth: '20rem',
                }}
            >
                <DropdownMenu className="pb-4">
                    <div className="px-4 py-3 flex flex-nowrap gap-4 justify-space-between text-sm">
                        {planName ? (
                            <span className="text-semibold block shrink-0" data-testid="userdropdown:label:plan-name">
                                {planName}
                            </span>
                        ) : null}

                        {organizationName ? (
                            <span
                                className="ml-auto text-ellipsis color-weak block"
                                title={organizationName}
                                data-testid="userdropdown:label:org-name"
                            >
                                {organizationName}
                            </span>
                        ) : null}

                        {displayUpgradeButton ? (
                            <ButtonLike
                                color="norm"
                                shape="underline"
                                className="text-ellipsis p-0 color-primary interactive-pseudo-protrude interactive--no-background"
                                as={SettingsLink}
                                path={upgradeUrl}
                                title={c('specialoffer: Link').t`Go to subscription plans`}
                            >{c('specialoffer: Link').t`Upgrade`}</ButtonLike>
                        ) : null}
                    </div>

                    {!viewportWidth['<=small'] && (
                        <div className="px-4 pb-4 text-sm flex flex-nowrap items-center">
                            <span
                                className="my-auto text-sm rounded border p-1 inline-block relative flex shrink-0 user-initials"
                                aria-hidden="true"
                            >
                                <span className="m-auto">{initials}</span>
                            </span>
                            <div className="flex-1 ml-2">
                                {nameToDisplay ? (
                                    <div
                                        className="text-ellipsis"
                                        title={nameToDisplay}
                                        data-testid="userdropdown:label:display-name"
                                    >
                                        {nameToDisplay}
                                    </div>
                                ) : null}

                                {Email ? (
                                    <div className="flex flex-nowrap justify-space-between items-center">
                                        <Tooltip title={c('Action').t`Copy address`} openDelay={250}>
                                            <button
                                                type="button"
                                                className={clsx([
                                                    'user-select relative interactive-pseudo-protrude interactive--no-background',
                                                    nameToDisplay || organizationName ? 'color-weak' : 'text-bold',
                                                ])}
                                                title={Email}
                                                data-testid="userdropdown:label:email"
                                                onClick={handleCopyEmail}
                                            >
                                                <span className="text-ellipsis block color-weak hover:color-norm">
                                                    {Email}
                                                </span>
                                            </button>
                                        </Tooltip>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    )}

                    {!isSentinelUser && isSecurityCheckupAvailable && securityCheckup.actions.length ? (
                        <AppLink
                            toApp={APPS.PROTONACCOUNT}
                            to={`${SECURITY_CHECKUP_PATHS.ROOT}?${securityCheckupParams.toString()}`}
                            className={clsx(
                                'recommended-actions',
                                'button button-no-hover',
                                'mx-4 mb-4 rounded p-3 flex flex-nowrap items-center gap-3 text-sm text-left'
                            )}
                            target="_self"
                        >
                            <Icon className="shrink-0" name="pass-shield-ok" size={6} />

                            <div>{c('Safety review').t`Review your account safety`}</div>
                        </AppLink>
                    ) : null}

                    {showSwitchAccountButton ? (
                        <div className="px-4 pb-2">
                            <ButtonLike
                                as="a"
                                href={switchHref}
                                target="_self"
                                shape="outline"
                                color="weak"
                                className="w-full"
                                onClick={(event: MouseEvent<HTMLAnchorElement>) => {
                                    if (
                                        APP_NAME !== APPS.PROTONACCOUNT &&
                                        event.button === 0 &&
                                        !getIsEventModified(event.nativeEvent)
                                    ) {
                                        event.preventDefault();
                                        return requestFork({ fromApp: APP_NAME, forkType: ForkType.SWITCH });
                                    }
                                }}
                                data-testid="userdropdown:button:switch-account"
                            >
                                {c('Action').t`Switch or add account`}
                            </ButtonLike>
                        </div>
                    ) : null}

                    {APP_NAME !== APPS.PROTONACCOUNT && APP_NAME !== APPS.PROTONVPN_SETTINGS ? (
                        <div className="px-4 pb-2">
                            <Button
                                shape="outline"
                                color="weak"
                                className="w-full"
                                onClick={() => goToSettings(path, APP_NAME, false)}
                                data-testid="userdropdown:button:settings"
                            >{c('Action').t`Settings`}</Button>
                        </div>
                    ) : undefined}

                    <div className="px-4 pb-4">
                        <Button
                            shape="solid"
                            color="norm"
                            className="w-full"
                            onClick={handleSignOutClick}
                            data-testid="userdropdown:button:logout"
                        >
                            {c('Action').t`Sign out`}
                        </Button>
                    </div>

                    {(() => {
                        if (viewportWidth['<=small'] && hasAppLinks) {
                            const availableApps = getAvailableApps({ user, context: 'dropdown' });
                            if (availableApps.length <= 1) {
                                return null;
                            }
                            return (
                                <ul className="px-4 pb-4 unstyled text-sm">
                                    {availableApps.map((appToLinkTo) => {
                                        const appToLinkToName = getAppShortName(appToLinkTo);
                                        const current = app && appToLinkTo === app;

                                        return (
                                            <li key={appToLinkTo}>
                                                <ProductLink
                                                    ownerApp={APP_NAME}
                                                    app={app}
                                                    appToLinkTo={appToLinkTo}
                                                    user={user}
                                                    className="flex flex-nowrap items-center color-weak text-no-decoration border-weak border-bottom interactive-pseudo relative py-1"
                                                >
                                                    <Logo
                                                        appName={appToLinkTo}
                                                        variant="glyph-only"
                                                        className="shrink-0 mr-2"
                                                    />
                                                    <span
                                                        className={clsx(current && 'color-norm text-semibold')}
                                                        aria-hidden
                                                    >
                                                        {appToLinkToName}
                                                    </span>
                                                </ProductLink>
                                            </li>
                                        );
                                    })}
                                </ul>
                            );
                        }
                        return null;
                    })()}

                    <div className="text-sm text-center flex flex-column gap-2">
                        {APP_NAME !== APPS.PROTONVPN_SETTINGS &&
                            referralProgramFeature?.Value &&
                            userSettings?.Referral?.Eligible && (
                                <div className="block">
                                    <SettingsLink
                                        className="mx-auto w-full px-2 link link-focus color-weak text-no-decoration hover:color-norm"
                                        path="/referral"
                                        onClick={close}
                                        data-testid="userdropdown:button:referral"
                                    >
                                        {c('Action').t`Refer a friend`}
                                        {redDotReferral ? <NotificationDot color={ThemeColor.Danger} /> : <span />}
                                    </SettingsLink>
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

                        {canSchedulePhoneCalls && (
                            <div className="block">
                                <button
                                    type="button"
                                    className="mx-auto w-full px-2 link link-focus color-weak text-no-decoration hover:color-norm"
                                    onClick={handleScheduleCallClick}
                                >
                                    {c('Action').t`Request a call`}
                                </button>
                            </div>
                        )}

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
                                        close();
                                        onOpenChat();
                                    }}
                                    data-testid="userdropdown:help:button:bugreport"
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
                                onClick={handleBugReportClick}
                                data-testid="userdropdown:help:button:bugreport"
                            >
                                {c('Action').t`Report a problem`}
                            </button>
                        </div>
                    </div>
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

export default UserDropdown;
