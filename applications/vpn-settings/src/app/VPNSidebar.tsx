import React, { type PropsWithChildren } from 'react';

import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import type { SectionConfig, SidebarConfig } from '@proton/components';
import { MainLogo, Spotlight, Toggle, useModalTwoStatic } from '@proton/components';
import Loader from '@proton/components/components/loader/Loader';
import SettingsListItem from '@proton/components/components/sidebar/SettingsListItem';
import Sidebar from '@proton/components/components/sidebar/Sidebar';
import SidebarList from '@proton/components/components/sidebar/SidebarList';
import SidebarNav from '@proton/components/components/sidebar/SidebarNav';
import { VisibilityTracker } from '@proton/components/components/visibility/VisibilityTracker';
import { getIsSectionAvailable, getSectionPath } from '@proton/components/containers/layout/helper';
import type { Subscription } from '@proton/payments/index';
import { APPS } from '@proton/shared/lib/constants';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces';
import { telemetry } from '@proton/shared/lib/telemetry';
import illustration from '@proton/styles/assets/img/illustrations/magic-wand-illustration.svg';
import { FeedbackModal, Sidebar as SidebarB } from '@proton/vpn/components/Sidebar';
import { useB2BAdminSidebarFeature } from '@proton/vpn/hooks/useB2BAdminSidebarFeature';

import VpnSidebarVersion from './containers/VpnSidebarVersion';

// Coupled because MainContainer.tsx#L230-231 also is using the state to control the mobile sidebar
type CoupledParentProps = {
    sidebarExpanded: boolean;
    onSidebarToggle: () => void;
};

const SidebarParent = ({ children, sidebarExpanded, onSidebarToggle }: PropsWithChildren<CoupledParentProps>) => {
    return (
        <Sidebar
            app={APPS.PROTONVPN_SETTINGS}
            appsDropdown={null}
            logo={<MainLogo to="/" />}
            expanded={sidebarExpanded}
            onToggleExpand={onSidebarToggle}
            version={<VpnSidebarVersion />}
            hasAppLinks={false}
        >
            {children}
        </Sidebar>
    );
};

const SidebarToggle = ({
    adminSidebarFeature,
    trackingData,
}: {
    adminSidebarFeature: ReturnType<typeof useB2BAdminSidebarFeature>;
    trackingData: Record<string, string | boolean>;
}) => {
    const [feedbackModal, showFeedbackModal] = useModalTwoStatic(FeedbackModal);

    return adminSidebarFeature.enabled ? (
        <div className="px-3 shrink-0">
            {feedbackModal}
            <Spotlight
                className="ml-5"
                show={adminSidebarFeature.spotlight.isOn}
                onClose={adminSidebarFeature.spotlight.setOff}
                originalPlacement="right"
                content={
                    <div className="flex flex-nowrap gap-3 items-center">
                        <img src={illustration} className="shrink-0" alt="" width={48} height={48} />
                        <div className="flex flex-row gap-0.5">
                            <span className="text-semibold">{c('Info').t`New sidebar layout`}</span>
                            <span>{c('Info').t`Key sections reorganized for faster access.`}</span>
                        </div>
                    </div>
                }
            >
                <div className="flex flex-row items-center justify-space-between">
                    {c('Info').t`New sidebar`}

                    <Toggle
                        id="sidebar-admin-toggle"
                        role="switch"
                        checked={adminSidebarFeature.sidebar.status}
                        onClick={() => {
                            telemetry.sendCustomEvent('b2b-admin-sidebar-toggled', {
                                ...trackingData,
                                from: adminSidebarFeature.sidebar.status ? 'on' : 'off',
                                to: adminSidebarFeature.sidebar.status ? 'off' : 'on',
                            });
                            adminSidebarFeature.sidebar.toggle();
                        }}
                    >
                        <span className="sr-only">{c('Info').t`Switch sidebars`}</span>
                    </Toggle>
                </div>
            </Spotlight>
            {adminSidebarFeature.feedback.isOn ? (
                <InlineLinkButton
                    className="text-sm"
                    onClick={() => {
                        showFeedbackModal({
                            onAction() {
                                adminSidebarFeature.feedback.setOff();
                            },
                        });
                    }}
                >{c('Action').t`Share feedback`}</InlineLinkButton>
            ) : null}
        </div>
    ) : null;
};

const TrackableSidebar = ({
    organization,
    subscription,
    sidebarExpanded,
    onSidebarToggle,
    routes,
    organizationRoutes,
}: {
    organization: OrganizationExtended | undefined;
    subscription: Subscription | undefined;
} & Props) => {
    const onViewEventKey = 'b2b-admin-sidebar-viewed';
    const [user] = useUser();

    const adminSidebarFeature = useB2BAdminSidebarFeature({ user, subscription, organization });
    const isSidebarActive = adminSidebarFeature.enabled && adminSidebarFeature.sidebar.status;
    const trackingData = {
        user: user.ID,
        ...(organization ? { organization: organization.ID } : undefined),
        isEnabled: adminSidebarFeature.enabled,
        isActive: isSidebarActive,
    };

    return (
        <VisibilityTracker
            onEnter={() => {
                telemetry.sendCustomEvent(onViewEventKey, trackingData);
            }}
            once
        >
            {isSidebarActive ? (
                <SidebarParent sidebarExpanded={sidebarExpanded} onSidebarToggle={onSidebarToggle}>
                    <SidebarNav className="overflow-auto">
                        <SidebarB routes={adminSidebarFeature.routes} />
                    </SidebarNav>
                    <SidebarToggle adminSidebarFeature={adminSidebarFeature} trackingData={trackingData} />
                </SidebarParent>
            ) : (
                <SidebarParent sidebarExpanded={sidebarExpanded} onSidebarToggle={onSidebarToggle}>
                    <VisibilityTracker
                        onEnter={() => {
                            telemetry.sendCustomEvent(onViewEventKey, trackingData);
                        }}
                        once
                    >
                        <SidebarNav>
                            <SidebarList>
                                {Object.values({
                                    ...routes,
                                    ...(organizationRoutes.available ? organizationRoutes.routes : {}),
                                }).map(
                                    (section: SectionConfig) =>
                                        getIsSectionAvailable(section) && (
                                            <SettingsListItem
                                                to={getSectionPath('', section)}
                                                icon={section.icon}
                                                notification={section.notification}
                                                key={section.to}
                                            >
                                                <span className="text-ellipsis" title={section.text}>
                                                    {section.text}
                                                </span>
                                            </SettingsListItem>
                                        )
                                )}
                            </SidebarList>
                        </SidebarNav>
                        <SidebarToggle adminSidebarFeature={adminSidebarFeature} trackingData={trackingData} />
                    </VisibilityTracker>
                </SidebarParent>
            )}
        </VisibilityTracker>
    );
};

type Props = {
    routes: Record<string, SectionConfig>;
    organizationRoutes: SidebarConfig;
} & CoupledParentProps;

export const VPNSidebar = ({ routes, organizationRoutes, sidebarExpanded, onSidebarToggle }: Props) => {
    const [subscription, loadingSubscription] = useSubscription();
    const [organization, loadingOrganization] = useOrganization();

    if (loadingSubscription || loadingOrganization) {
        return (
            <SidebarParent sidebarExpanded={sidebarExpanded} onSidebarToggle={onSidebarToggle}>
                <Loader size="medium" />
            </SidebarParent>
        );
    }

    return (
        <TrackableSidebar
            routes={routes}
            organizationRoutes={organizationRoutes}
            organization={organization}
            subscription={subscription}
            sidebarExpanded={sidebarExpanded}
            onSidebarToggle={onSidebarToggle}
        />
    );
};
