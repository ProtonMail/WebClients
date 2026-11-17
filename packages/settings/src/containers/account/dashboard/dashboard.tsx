import type { PropsWithChildren } from 'react';

import { c } from 'ttag';

import DriveBlogSection from '@proton/components/containers/account/dashboard/drive/DriveBlogSection/DriveBlogSection';
import DriveDownloadAndInfoSection from '@proton/components/containers/account/dashboard/drive/DriveDownloadAndInfoSection/DriveDownloadAndInfoSection';
import MailBlogSection from '@proton/components/containers/account/dashboard/mail/MailBlogSection/MailBlogSection';
import { MailDownloadAndInfoSection } from '@proton/components/containers/account/dashboard/mail/MailDownloadAndInfoSection/MailDownloadAndInfoSection';
import MeetDownloadAndInfoSection from '@proton/components/containers/account/dashboard/meet/MeetDownloadAndInfoSection/MeetDownloadAndInfoSection';
import PassBlogSection from '@proton/components/containers/account/dashboard/pass/PassBlogSection/PassBlogSection';
import PassDownloadAndInfoSection from '@proton/components/containers/account/dashboard/pass/PassDownloadAndInfoSection/PassDownloadAndInfoSection';
import AlsoInYourPlanSection from '@proton/components/containers/account/dashboard/shared/AlsoInYourPlanSection/AlsoInYourPlanSection';
import AlsoInYourPlanProtonDrive from '@proton/components/containers/account/dashboard/shared/AlsoInYourPlanSection/products/AlsoInYourPlanProtonDrive';
import AlsoInYourPlanProtonMail from '@proton/components/containers/account/dashboard/shared/AlsoInYourPlanSection/products/AlsoInYourPlanProtonMail';
import AlsoInYourPlanProtonPass from '@proton/components/containers/account/dashboard/shared/AlsoInYourPlanSection/products/AlsoInYourPlanProtonPass';
import AlsoInYourPlanProtonVPN from '@proton/components/containers/account/dashboard/shared/AlsoInYourPlanSection/products/AlsoInYourPlanProtonVPN';
import PrivateMainSettingsArea from '@proton/components/containers/layout/PrivateMainSettingsArea';
import type { SettingsAreaConfig } from '@proton/components/containers/layout/interface';
import { SettingsCardMaxWidth } from '@proton/components/containers/layout/interface';
import { UpsellModalTelemetryProvider } from '@proton/components/containers/payments/subscription/UpsellModalTelemetryProvider';
import BundleUpsellBanner from '@proton/components/containers/payments/subscription/YourPlanSectionV2/Upsells/BundleUpsellBanner';
import WorkspaceFromFreeBanner2 from '@proton/components/containers/payments/subscription/YourPlanSectionV2/Upsells/meet/WorkspaceFromFreeBanner2';
import YourPlanSectionV2 from '@proton/components/containers/payments/subscription/YourPlanSectionV2/YourPlanSectionV2';
import { YourPlanUpsellsSectionV2 } from '@proton/components/containers/payments/subscription/YourPlanSectionV2/YourPlanUpsellsSectionV2';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';

import PendingInvitations from '../../pendingInvitations/PendingInvitations';

interface Props {
    app: APP_NAMES;
    config: SettingsAreaConfig;
}

const DashboardWrapper = ({ children, config }: PropsWithChildren<Props>) => {
    return (
        <PrivateMainSettingsArea
            config={config}
            mainAreaClass="bg-lowered settings-cards"
            wrapperClass="w-full p-4 lg:pt-6 xl:pt-12 max-w-custom mx-0 lg:mx-4 xl:mx-6 xxl:mx-14 transition-spacings"
            style={{ '--max-w-custom': SettingsCardMaxWidth.Wide }}
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
            <div>{/* Hidden blog section */}</div>
        </DashboardWrapper>
    );
};

const AccountGenericDashboard = ({ app, config }: Props) => {
    return (
        <DashboardWrapper config={config} app={app}>
            <PendingInvitations />
            <YourPlanSectionV2 app={app} />
            <YourPlanUpsellsSectionV2 app={app} />
            <div>{/* Hidden download section */}</div>
            <AlsoInYourPlanSection
                app={app}
                title={c('Title').t`Get more from your privacy suite`}
                subtitle={c('Title').t`With your ${BRAND_NAME} Account, you get access to all ${BRAND_NAME} apps`}
                upsellBanner={<BundleUpsellBanner app={app} />}
            >
                <AlsoInYourPlanProtonMail />
                <AlsoInYourPlanProtonPass />
                <AlsoInYourPlanProtonDrive />
                <AlsoInYourPlanProtonVPN />
            </AlsoInYourPlanSection>
            <div>{/* Hidden blog section */}</div>
        </DashboardWrapper>
    );
};

const getProductDashboard = ({ app, config }: Props) => {
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
        case APPS.PROTONACCOUNT:
        case APPS.PROTONSPACES:
            return <AccountGenericDashboard app={app} config={config} />;
    }
};

const AccountDashboard = ({ app, config }: Props) => {
    return (
        <UpsellModalTelemetryProvider context="account-home">
            {getProductDashboard({ app, config })}
        </UpsellModalTelemetryProvider>
    );
};

export default AccountDashboard;
