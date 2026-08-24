import type { PropsWithChildren } from 'react';

import { c } from 'ttag';

import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';

import PrivateMainSettingsArea from '../../layout/PrivateMainSettingsArea';
import type { SettingsAreaConfig } from '../../layout/interface';
import { SettingsCardMaxWidth } from '../../layout/interface';
import { UpsellModalTelemetryProvider } from '../../payments/subscription/SubscriptionModalProvider';
import PendingInvitations from '../../payments/subscription/YourPlanSectionV2/PendingInvitations';
import BundleUpsellBanner from '../../payments/subscription/YourPlanSectionV2/Upsells/BundleUpsellBanner';
import WorkspaceFromFreeBanner2 from '../../payments/subscription/YourPlanSectionV2/Upsells/meet/WorkspaceFromFreeBanner2';
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
