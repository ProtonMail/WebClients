import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { Spotlight, Toggle, useModalTwoStatic } from '@proton/components/index';
import { telemetry } from '@proton/shared/lib/telemetry';
import illustration from '@proton/styles/assets/img/illustrations/magic-wand-illustration.svg';

import { FeedbackModal } from '.';
import type { useB2BAdminSidebarFeature } from '../../hooks/useB2BAdminSidebarFeature';

export const SidebarToggle = ({
    adminSidebarFeature,
}: {
    adminSidebarFeature: ReturnType<typeof useB2BAdminSidebarFeature>;
}) => {
    const [user] = useUser();
    const [organization] = useOrganization();
    const [feedbackModal, showFeedbackModal] = useModalTwoStatic(FeedbackModal);

    const trackingData = {
        user: user.ID,
        ...(organization ? { organization: organization.ID } : undefined),
        isEnabled: adminSidebarFeature.enabled,
        isActive: adminSidebarFeature.enabled ? adminSidebarFeature.sidebar.status : false,
    };

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
            <InlineLinkButton
                className="text-sm"
                onClick={() => {
                    showFeedbackModal({});
                }}
            >{c('Action').t`Share feedback`}</InlineLinkButton>
        </div>
    ) : null;
};
