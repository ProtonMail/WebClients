import type { MouseEvent } from 'react';
import { Suspense, lazy, useRef, useState } from 'react';

import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import ContextMenu from '@proton/components/components/contextMenu/ContextMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import Icon from '@proton/components/components/icon/Icon';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Spotlight from '@proton/components/components/spotlight/Spotlight';
import useSpotlightShow from '@proton/components/components/spotlight/useSpotlightShow';
import TopNavbarListItemButton from '@proton/components/components/topnavbar/TopNavbarListItemButton';
import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import useApi from '@proton/components/hooks/useApi';
import useConfig from '@proton/components/hooks/useConfig';
import useSpotlightOnFeature from '@proton/components/hooks/useSpotlightOnFeature';
import { useFeature } from '@proton/features/index';
import { FeatureCode } from '@proton/features/interface';
import { getIsB2BAudienceFromPlan } from '@proton/payments';
import { TelemetryB2BOnboardingEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { SECOND } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { canShowB2BOnboardingButton } from '@proton/shared/lib/onboarding/helpers';
import { isAdmin } from '@proton/shared/lib/user/helpers';
import buildingImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-buildings.svg';
import { useFlag } from '@proton/unleash';
import clsx from '@proton/utils/clsx';

import './TopNavbarB2BOnboardingButton.scss';

const B2BOnboardingModal = lazy(
    () =>
        import(
            /* webpackChunkName: "B2BOnboardingModal" */
            '@proton/components/components/onboarding/b2b/B2BOnboardingModal'
        )
);

const TopNavbarB2BOnboardingButton = () => {
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [organization] = useOrganization();
    const { APP_NAME } = useConfig();
    const api = useApi();
    const showB2BButtonFeatureFlag = useFeature(FeatureCode.ShowB2BOnboardingButton);
    const b2bOnboardingEnabled = useFlag('B2BOnboarding');

    const [onboardingModal, setOnboardingModal, renderOnboardingModal] = useModalState();
    const { viewportWidth } = useActiveBreakpoint();

    /* Show the button when:
     * - User is an org admin && subscribed to a b2b plan
     * - B2BOnboarding feature is available
     * - Button can be displayed (user subscribed less than 60 days ago)
     * - User did not hide the button manually
     */
    const isB2BAdmin = isAdmin(user) && getIsB2BAudienceFromPlan(organization?.PlanName);
    const canShowB2BButton =
        isB2BAdmin &&
        b2bOnboardingEnabled &&
        canShowB2BOnboardingButton(subscription) &&
        showB2BButtonFeatureFlag.feature?.Value === true;

    const {
        show: showSpotlight,
        onDisplayed,
        onClose,
    } = useSpotlightOnFeature(FeatureCode.B2BOnboardingSpotlight, true);
    const shouldShowSpotlight = useSpotlightShow(showSpotlight, 3 * SECOND);

    const [contextMenuOpened, setContextMenuOpened] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState<{ top: number; left: number }>();
    const anchorRef = useRef<HTMLButtonElement>(null);

    if (!canShowB2BButton) {
        return null;
    }

    const handleContextMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        e.preventDefault();
        setContextMenuPosition({ top: e.clientY, left: e.clientX });

        setContextMenuOpened(true);
    };

    const handleHideB2BNavbarButton = (e: MouseEvent) => {
        e.stopPropagation();

        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.b2bOnboarding,
            event: TelemetryB2BOnboardingEvents.hide_navbar_button,
            dimensions: {
                app: APP_NAME,
            },
            delay: false,
        });

        // We are hiding automatically the button after 60 days.
        // But the user can hide it manually by right-clicking on the button.
        void showB2BButtonFeatureFlag.update(false);
    };

    return (
        <>
            <Spotlight
                originalPlacement="bottom"
                show={shouldShowSpotlight}
                onClose={onClose}
                onDisplayed={onDisplayed}
                content={
                    <div className="flex flex-nowrap gap-x-2">
                        <div className="shrink-0">
                            <img src={buildingImg} alt="" />
                        </div>
                        <div>
                            <b>{c('Info').t`Set up your organization`}</b>
                            <br />
                            {c('Info').t`Open the guide for recommended actions and helpful links.`}
                        </div>
                    </div>
                }
            >
                <li className="topnav-listItem shrink-0 topnav-listItem--noCollapse">
                    <TopNavbarListItemButton
                        as="button"
                        shape="outline"
                        color="weak"
                        type="button"
                        title={c('Title').t`Org setup`}
                        className={clsx('topnav-org-setup', viewportWidth['<=medium'] && 'button-for-icon')}
                        onClick={() => setOnboardingModal(true)}
                        icon={<Icon name="buildings" />}
                        text={c('Title').t`Org setup`}
                        ref={anchorRef}
                        onContextMenu={handleContextMenu}
                        aria-label={c('Title').t`Organization setup`}
                    />
                </li>
            </Spotlight>
            <ContextMenu
                anchorRef={anchorRef}
                position={contextMenuPosition}
                isOpen={contextMenuOpened}
                close={() => setContextMenuOpened(false)}
            >
                <DropdownMenuButton
                    onContextMenu={(e) => e.stopPropagation()}
                    className="flex items-center flex-nowrap text-left"
                    onClick={handleHideB2BNavbarButton}
                >
                    {c('Action').t`Remove button`}
                </DropdownMenuButton>
            </ContextMenu>
            {renderOnboardingModal && (
                <ErrorBoundary>
                    <Suspense fallback={null}>
                        <B2BOnboardingModal source="navbar-button" {...onboardingModal} />
                    </Suspense>
                </ErrorBoundary>
            )}
        </>
    );
};

export default TopNavbarB2BOnboardingButton;
