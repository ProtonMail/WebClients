import React from 'react';
import { c } from 'ttag';
import { PLANS, APPS } from '@proton/shared/lib/constants';
import { VPNCountries, VPNServers } from '@proton/shared/lib/interfaces';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { getPlusServers } from '@proton/shared/lib/vpn/features';
import { Icon, Info } from '../../../components';

interface Props {
    planName: PLANS;
    vpnCountries: VPNCountries;
    vpnServers: VPNServers;
}

export interface FeatureItem {
    feature: React.ReactNode;
    tooltip?: string;
    link?: string;
}

const mailAppName = getAppName(APPS.PROTONMAIL);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getPlanFeatures = (planName: PLANS, vpnCountries: VPNCountries, vpnServers: VPNServers) => {
    const features = [];
    const numberOfPlusCountries = vpnCountries[PLANS.VPNPLUS].count;
    // B2C tooltips
    const storageTooltip = c('Tooltip')
        .t`Storage space is shared across Mail, Drive, and Calendar. Those managing family accounts can allocate to individual family members different storage amounts.`;
    const addressesTooltip = c('Tooltip')
        .t`Create multiple email addresses to protect and match your online identities, e.g., JohnShopper@proton.me for your shopping accounts, JohnNews@proton.me for all your news subscriptions.Create multiple email addresses to protect and match your online identities, e.g., JohnShopper@proton.me for your shopping accounts, JohnNews@proton.me for all your news subscriptions.`;
    const labelsTooltip = c('Tooltip')
        .t`Create as many folders, labels, and filters as you need to help you organize your messages.`;
    const domainsTooltip = c('Tooltip')
        .t`Customize your email addresses with your own domain purchased from a domain name registrar, e.g., JohnSmith@myownaddress.com.`;
    const eventsTooltip = c('Tooltip')
        .t`Calendars have full events-management capabilities and integrate into ${mailAppName} for easy scheduling with all your contacts.`;
    const vpnSafeTooltip = c('Tooltip')
        .t`Safeguard your internal data with VPN by ensuring everyone in your organization's internet connections are secure, even when they are connecting remotely.`;

    const vpnSpeedTooltip = c('Tooltip')
        .t`Protect you and your family's identity, location, and data every time you go online, even on public wi-fi networks. Multiple VPN connections are useful for multiple devices.`;
    const netShieldTooltip = c('Tooltip')
        .t`Specially designed NetShield protects your device and speeds up your browsing by blocking ads, trackers, and malware.`;
    const streamingTooltip = c('Tooltip')
        .t`Access top shows and other digital content, including geographically blocked content, with VPN and a streaming service like Netflix, Disney+, and Prime Video.`;

    // const vpnLoginTooltip = c('Tooltip')
    //     .t`Each user is provided login credentials to access their individual email mailboxes, calendars, and VPN connections.`;
    // const adminTooltip = c('Tooltip').t`Add, manage and remove users from the admin console.`;
    // B2B tooltips
    const b2bMembersTooltip = c('Tooltip')
        .t`Plan supports up to 5000 users. Should you need more than 5000 user accounts, please contact our Customer Success team.`;
    const b2bStorageTooltip = c('Tooltip')
        .t`Administrators can decide how much storage to allocate to each user. To determine total storage available to allocate, multiply number of users by the per-user storage amount included in your plan.`;
    const b2bAddressesTooltip = c('Tooltip')
        .t`A user can have multiple email aliases associated with their mailbox. However, a single mailbox cannot be shared by multiple users.`;
    const b2bDomainsTooltip = c('Tooltip')
        .t`Customize your email addresses with your own domain purchased from a domain name registrar e.g., JohnSmith@mycompanydomain.com.`;
    const mailTooltip = c('Tooltip')
        .t`Premium features include a variety of personalisation and automation features such as labels, folders, filters and auto-reply.`;
    const driveTooltip = c('Tooltip')
        .t`Proton Drive (beta) is an encrypted cloud storage solution for easy, secure storage and transfer of files.`;
    const vpnTooltip = c('Tooltip').t`Secure all of your internet usage with ProtonVPN.`;

    if (planName === PLANS.MAIL) {
        features.push(
            ...[
                { feature: c('Plan feature').t`15 GB total storage`, tooltip: storageTooltip },
                { feature: c('Plan feature').t`10 email addresses`, tooltip: addressesTooltip },
                { feature: c('Plan feature').t`Unlimited mailbox personalization`, tooltip: labelsTooltip },
                { feature: c('Plan feature').t`Support for 1 custom email domain`, tooltip: domainsTooltip },
                { feature: c('Plan feature').t`Easy, secure calendar sharing`, tooltip: eventsTooltip },
            ]
        );
    }

    if (planName === PLANS.DRIVE) {
        features.push(...[{ feature: c('Plan feature').t`200 GB total storage`, tooltip: storageTooltip }]);
    }

    if (planName === PLANS.VPN) {
        features.push(
            ...[
                { feature: c('Plan feature').t`10 high-speed VPN connections`, tooltip: vpnSpeedTooltip },
                { feature: c('Plan feature').t`Built-in ad-blocker (NetShield)`, tooltip: netShieldTooltip },
                { feature: c('Plan feature').t`Access to streaming services globally`, tooltip: streamingTooltip },
                { feature: getPlusServers(numberOfPlusCountries) },
            ]
        );
    }

    if (planName === PLANS.BUNDLE) {
        features.push(
            ...[
                { feature: c('Plan feature').t`500 GB total storage`, tooltip: storageTooltip },
                { feature: c('Plan feature').t`15 email addresses`, tooltip: addressesTooltip },
                { feature: c('Plan feature').t`Unlimited mailbox personalization`, tooltip: labelsTooltip },
                { feature: c('Plan feature').t`Support for 3 custom email domains`, tooltip: domainsTooltip },
                { feature: c('Plan feature').t`Easy, secure calendar sharing`, tooltip: eventsTooltip },
                { feature: c('Plan feature').t`10 high-speed VPN connections`, tooltip: vpnSpeedTooltip },
                { feature: c('Plan feature').t`Built-in ad-blocker (NetShield)`, tooltip: netShieldTooltip },
                { feature: c('Plan feature').t`Access to streaming services globally`, tooltip: streamingTooltip },
                { feature: getPlusServers(numberOfPlusCountries) },
            ]
        );
    }

    if (planName === PLANS.FAMILY) {
        features.push(
            ...[
                { feature: c('Plan feature').t`2.5 TB total storage`, tooltip: storageTooltip },
                { feature: c('Plan feature').t`Multiple email addresses for every user`, tooltip: addressesTooltip },
                { feature: c('Plan feature').t`Unlimited mailbox personalization`, tooltip: labelsTooltip },
                { feature: c('Plan feature').t`Support for 5 custom email domains`, tooltip: domainsTooltip },
                { feature: c('Plan feature').t`Easy, secure calendar sharing`, tooltip: eventsTooltip },
                {
                    feature: c('Plan feature').t`Multiple high-speed VPN connections for every member`,
                    tooltip: vpnSpeedTooltip,
                },
                { feature: c('Plan feature').t`Built-in ad-blocker (NetShield)`, tooltip: netShieldTooltip },
                { feature: c('Plan feature').t`Access to streaming services globally`, tooltip: streamingTooltip },
                { feature: getPlusServers(numberOfPlusCountries) },
            ]
        );
    }

    if (planName === PLANS.NEW_VISIONARY) {
        // Nothing since not display
    }

    if (planName === PLANS.MAIL_PRO) {
        features.push(
            ...[
                { feature: c('Plan feature').t`As many users as needed`, tooltip: b2bMembersTooltip },
                { feature: c('Plan feature').t`15 GB storage per user`, tooltip: b2bStorageTooltip },
                { feature: c('Plan feature').t`10 email addresses per user`, tooltip: b2bAddressesTooltip },
                {
                    feature: c('Plan feature').t`Support for 3 custom email domains`,
                    tooltip: b2bDomainsTooltip,
                },
                { feature: c('Plan feature').t`20 calendars per user`, tooltip: eventsTooltip },
                { feature: c('Plan feature').t`1 VPN connection per user`, tooltip: vpnSafeTooltip },

                { feature: c('Plan feature').t`All premium email & calendar features`, tooltip: mailTooltip },
                { feature: c('Plan feature').t`Free access to Proton Drive (beta)`, tooltip: driveTooltip },
            ]
        );
    }

    if (planName === PLANS.DRIVE_PRO) {
        features.push(
            ...[
                { feature: c('Plan feature').t`15 GB total storage`, tooltip: storageTooltip },
                { feature: c('Plan feature').t`10 email addresses`, tooltip: addressesTooltip },
                { feature: c('Plan feature').t`Unlimited mailbox personalization`, tooltip: labelsTooltip },
                { feature: c('Plan feature').t`Support for 1 personal domain`, tooltip: domainsTooltip },
                { feature: c('Plan feature').t`Easy, secure calendar sharing`, tooltip: eventsTooltip },
            ]
        );
    }

    if (planName === PLANS.BUNDLE_PRO) {
        features.push(
            ...[
                { feature: c('Plan feature').t`As many users as needed`, tooltip: b2bMembersTooltip },
                { feature: c('Plan feature').t`500 GB storage per user`, tooltip: b2bStorageTooltip },
                { feature: c('Plan feature').t`15 email addresses per user`, tooltip: b2bAddressesTooltip },
                {
                    feature: c('Plan feature').t`Support for 5 domains across your business`,
                    tooltip: b2bDomainsTooltip,
                },
                { feature: c('Plan feature').t`20 calendars per user`, tooltip: eventsTooltip },
                { feature: c('Plan feature').t`10 high-speed VPN connections per user`, tooltip: vpnSafeTooltip },
                { feature: c('Plan feature').t`All premium mail & calendar features`, tooltip: mailTooltip },
                { feature: c('Plan feature').t`Free access to Proton Drive (Beta)`, tooltip: driveTooltip },
                { feature: c('Plan feature').t`All premium VPN features`, tooltip: vpnTooltip },
            ]
        );
    }

    if (planName === PLANS.ENTERPRISE) {
        features.push(
            ...[
                { feature: c('Plan feature').t`As many users as needed`, tooltip: b2bMembersTooltip },
                { feature: c('Plan feature').t`1000 GB storage per user`, tooltip: b2bStorageTooltip },
                { feature: c('Plan feature').t`15 email addresses per user`, tooltip: b2bAddressesTooltip },
                {
                    feature: c('Plan feature').t`Support for 10 domains across your business`,
                    tooltip: b2bDomainsTooltip,
                },
                { feature: c('Plan feature').t`20 calendars per user`, tooltip: eventsTooltip },
                { feature: c('Plan feature').t`10 high-speed VPN connections per user`, vpnSafeTooltip },
                { feature: c('Plan feature').t`All premium mail & calendar features`, tooltip: mailTooltip },
                { feature: c('Plan feature').t`Free access to Proton Drive (Beta)`, tooltip: driveTooltip },
                { feature: c('Plan feature').t`All premium VPN features`, tooltip: vpnTooltip },
                { feature: c('Plan feature').t`Dedicated account manager` },
            ]
        );
    }
    return features;
};

const PlanCardFeatures = ({ planName, vpnCountries, vpnServers }: Props) => {
    const features = getPlanFeatures(planName, vpnCountries, vpnServers);

    if (!features.length) {
        return null;
    }

    return (
        <ul className="unstyled mb0 plan-selection-features">
            {features.map((item: FeatureItem, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <li key={`feature-${index}`} className="flex flex-nowrap mb0-5">
                    <span className="flex-item-noshrink mr1">
                        <Icon name="check" className="color-primary" />
                    </span>
                    <span>
                        {item.feature}
                        {item.tooltip ? <Info className="ml0-5" title={item.tooltip} url={item.link} /> : null}
                    </span>
                </li>
            ))}
        </ul>
    );
};

export default PlanCardFeatures;
