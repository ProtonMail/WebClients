import type { PropsWithChildren } from 'react';

import PendingInvitations from '@proton/components/containers/payments/subscription/YourPlanSectionV2/PendingInvitations';
import BundleUpsellBanner from '@proton/components/containers/payments/subscription/YourPlanSectionV2/Upsells/BundleUpsellBanner';
import WorkspaceFromFreeBanner2 from '@proton/components/containers/payments/subscription/YourPlanSectionV2/Upsells/meet/WorkspaceFromFreeBanner2';
import { PrivateMainSettingsArea, type SettingsAreaConfig } from '@proton/components/index';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';

import YourPlanSectionV2 from '../../payments/subscription/YourPlanSectionV2/YourPlanSectionV2';
import { YourPlanUpsellsSectionV2 } from '../../payments/subscription/YourPlanSectionV2/YourPlanUpsellsSectionV2';
import DriveBlogSection from './drive/DriveBlogSection/DriveBlogSection';
import DriveDownloadAndInfoSection from './drive/DriveDownloadAndInfoSection/DriveDownloadAndInfoSection';
import MailBlogSection from './mail/MailBlogSection/MailBlogSection';
import { MailDownloadAndInfoSection } from './mail/MailDownloadAndInfoSection/MailDownloadAndInfoSection';
import MeetDownloadAndInfoSection from './meet/MeetDownloadAndInfoSection/MeetDownloadAndInfoSection';
import PassBlogSection from './pass/PassBlogSection/PassBlogSection';
import PassDownloadAndInfoSection from './pass/PassDownloadAndInfoSection/PassDownloadAndInfoSection';
import AlsoInYourPlanSection from './shared/AlsoInYourPlanSection/AlsoInYourPlanSection';
import AlsoInYourPlanProtonDrive from './shared/AlsoInYourPlanSection/products/AlsoInYourPlanProtonDrive';
import AlsoInYourPlanProtonMail from './shared/AlsoInYourPlanSection/products/AlsoInYourPlanProtonMail';
import AlsoInYourPlanProtonPass from './shared/AlsoInYourPlanSection/products/AlsoInYourPlanProtonPass';
import AlsoInYourPlanProtonVPN from './shared/AlsoInYourPlanSection/products/AlsoInYourPlanProtonVPN';

interface Props {
    app: APP_NAMES;
    config: SettingsAreaConfig;
}

const DashboardWrapper = ({ children, config }: PropsWithChildren<Props>) => {
    return (
        <PrivateMainSettingsArea
            config={config}
            mainAreaClass="bg-lowered settings-cards"
            wrapperClass="w-full p-4 lg:p-6 xl:p-12 max-w-custom mx-auto"
            style={{ '--max-w-custom': '93.75rem' }}
        >
            {children}
        </PrivateMainSettingsArea>
    );
};

const AccountMailDashboard = ({ app, config }: Props) => {
    return (
        <DashboardWrapper config={config} app={app}>
            <PendingInvitations />
            <YourPlanSectionV2 app={app} />
            <YourPlanUpsellsSectionV2 app={app} />
            <MailDownloadAndInfoSection app={app} />
            <AlsoInYourPlanSection app={app} upsellBanner={<BundleUpsellBanner app={app} />}>
                <AlsoInYourPlanProtonPass />
                <AlsoInYourPlanProtonDrive />
                <AlsoInYourPlanProtonVPN />
            </AlsoInYourPlanSection>
            <MailBlogSection />
        </DashboardWrapper>
    );
};

const AccountPassDashboard = ({ app, config }: Props) => {
    return (
        <DashboardWrapper config={config} app={app}>
            <PendingInvitations />
            <YourPlanSectionV2 app={app} />
            <YourPlanUpsellsSectionV2 app={app} />
            <PassDownloadAndInfoSection app={app} />
            <AlsoInYourPlanSection app={app} upsellBanner={<BundleUpsellBanner app={app} />}>
                <AlsoInYourPlanProtonMail />
                <AlsoInYourPlanProtonVPN />
                <AlsoInYourPlanProtonDrive />
            </AlsoInYourPlanSection>
            <PassBlogSection />
        </DashboardWrapper>
    );
};

const AccountDriveDashboard = ({ app, config }: Props) => {
    return (
        <DashboardWrapper config={config} app={app}>
            <PendingInvitations />
            <YourPlanSectionV2 app={app} />
            <YourPlanUpsellsSectionV2 app={app} />
            <DriveDownloadAndInfoSection app={app} />
            <AlsoInYourPlanSection app={app} upsellBanner={<BundleUpsellBanner app={app} />}>
                <AlsoInYourPlanProtonPass />
                <AlsoInYourPlanProtonMail />
                <AlsoInYourPlanProtonVPN />
            </AlsoInYourPlanSection>
            <DriveBlogSection />
        </DashboardWrapper>
    );
};

const AccountMeetDashboard = ({ app, config }: Props) => {
    return (
        <DashboardWrapper config={config} app={app}>
            <PendingInvitations />
            <YourPlanSectionV2 app={app} />
            <YourPlanUpsellsSectionV2 app={app} />
            <MeetDownloadAndInfoSection app={app} />
            <AlsoInYourPlanSection app={app} upsellBanner={<WorkspaceFromFreeBanner2 app={app} />}>
                <AlsoInYourPlanProtonDrive />
                <AlsoInYourPlanProtonPass />
                <AlsoInYourPlanProtonMail />
            </AlsoInYourPlanSection>
        </DashboardWrapper>
    );
};

const AccountDashboard = ({ app, config }: Props) => {
    switch (app) {
        case APPS.PROTONMAIL:
        case APPS.PROTONCALENDAR:
            return <AccountMailDashboard app={app} config={config} />;
        case APPS.PROTONPASS:
            return <AccountPassDashboard app={app} config={config} />;
        case APPS.PROTONDRIVE:
            return <AccountDriveDashboard app={app} config={config} />;
        case APPS.PROTONMEET:
            return <AccountMeetDashboard app={app} config={config} />;
    }
};

export default AccountDashboard;
