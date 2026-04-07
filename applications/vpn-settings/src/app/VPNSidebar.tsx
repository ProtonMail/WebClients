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
import { getIsSectionAvailable, getSectionPath } from '@proton/components/containers/layout/helper';
import { APPS } from '@proton/shared/lib/constants';
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
}: {
    adminSidebarFeature: ReturnType<typeof useB2BAdminSidebarFeature>;
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
                        onClick={adminSidebarFeature.sidebar.toggle}
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

type Props = {
    routes: Record<string, SectionConfig>;
    organizationRoutes: SidebarConfig;
} & CoupledParentProps;

export const VPNSidebar = ({ routes, organizationRoutes, sidebarExpanded, onSidebarToggle }: Props) => {
    const [user] = useUser();
    const [subscription, loadingSubscription] = useSubscription();
    const [organization, loadingOrganization] = useOrganization();
    const adminSidebarFeature = useB2BAdminSidebarFeature({ user, subscription, organization });

    if (loadingSubscription || loadingOrganization) {
        return (
            <SidebarParent sidebarExpanded={sidebarExpanded} onSidebarToggle={onSidebarToggle}>
                <Loader size="medium" />
            </SidebarParent>
        );
    }

    if (adminSidebarFeature.enabled && adminSidebarFeature.sidebar.status) {
        return (
            <SidebarParent sidebarExpanded={sidebarExpanded} onSidebarToggle={onSidebarToggle}>
                <SidebarNav className="overflow-auto">
                    <SidebarB routes={adminSidebarFeature.routes} />
                </SidebarNav>
                <SidebarToggle adminSidebarFeature={adminSidebarFeature} />
            </SidebarParent>
        );
    }

    return (
        <SidebarParent sidebarExpanded={sidebarExpanded} onSidebarToggle={onSidebarToggle}>
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
            <SidebarToggle adminSidebarFeature={adminSidebarFeature} />
        </SidebarParent>
    );
};
