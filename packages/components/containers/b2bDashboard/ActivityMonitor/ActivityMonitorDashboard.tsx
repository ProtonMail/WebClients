import { useState } from 'react';

import { c } from 'ttag';

import Tabs from '@proton/components/components/tabs/Tabs';
import {
    type Subscription,
    hasAnyBundlePro,
    hasBundlePro,
    hasBundlePro2024,
    hasPassBusiness,
    hasVpnBusiness,
} from '@proton/payments';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { hasOrganizationSetup, hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import type { OrganizationExtended, UserModel } from '@proton/shared/lib/interfaces';
import useFlag from '@proton/unleash/useFlag';
import isTruthy from '@proton/utils/isTruthy';

import SettingsSectionExtraWide from '../../account/SettingsSectionExtraWide';
import { OrganizationEvents } from '../Organization/OrganizationEvents';
import { PassEvents } from '../Pass/PassEvents';
import { VPNEvents } from '../VPN/VPNEvents';
import ActivityMonitorEvents from './ActivityMonitorEvents';

interface Props {
    user: UserModel;
    organization?: OrganizationExtended;
    subscription?: Subscription;
}

const canViewB2BActivityMonitor = (user: UserModel, organization?: OrganizationExtended) => {
    const isAdmin = user.isAdmin && user.isSelf;
    const hasOrganizationKey = hasOrganizationSetupWithKeys(organization);
    const hasOrganization = hasOrganizationSetup(organization);

    return (hasOrganizationKey || hasOrganization) && isAdmin;
};

const useCanViewB2BOrganization = (user: UserModel, organization?: OrganizationExtended) => {
    const isAdmin = user.isAdmin && user.isSelf;
    const hasOrganizationKey = hasOrganizationSetupWithKeys(organization);
    const hasOrganization = hasOrganizationSetup(organization);
    const canDisplayB2BOrganizationEvents = useFlag('B2BOrganizationMonitor');

    return canDisplayB2BOrganizationEvents && (hasOrganizationKey || hasOrganization) && isAdmin;
};

const useCanViewGatewayMonitor = (
    user: UserModel,
    organization?: OrganizationExtended,
    subscription?: Subscription
) => {
    const isAdmin = user.isAdmin && user.isSelf;
    const hasOrganizationKey = hasOrganizationSetupWithKeys(organization);
    const hasOrganization = hasOrganizationSetup(organization);
    const canHaveOrganization = !user.isMember && !!organization && isAdmin;
    const hasPlanWithEventLogging =
        hasVpnBusiness(subscription) || hasBundlePro(subscription) || hasBundlePro2024(subscription);
    const canDisplayB2BLogsVPN = useFlag('B2BLogsVPN');

    return (
        canDisplayB2BLogsVPN &&
        hasPlanWithEventLogging &&
        canHaveOrganization &&
        (hasOrganizationKey || hasOrganization)
    );
};

const useCanViewPassMonitor = (user: UserModel, organization?: OrganizationExtended, subscription?: Subscription) => {
    const isAdmin = user.isAdmin && user.isSelf;
    const hasOrganizationKey = hasOrganizationSetupWithKeys(organization);
    const hasOrganization = hasOrganizationSetup(organization);
    const canHaveOrganization = !user.isMember && !!organization && isAdmin;
    const hasPassOrBundleB2B = hasPassBusiness(subscription) || hasAnyBundlePro(subscription);
    const canDisplayB2BLogsPass = useFlag('B2BLogsPass');

    return (
        canDisplayB2BLogsPass && hasPassOrBundleB2B && canHaveOrganization && (hasOrganizationKey || hasOrganization)
    );
};

const ActivityMonitorDashboard = ({ user, organization, subscription }: Props) => {
    const [activeTab, setActiveTab] = useState(0);

    const tabs = [
        canViewB2BActivityMonitor(user, organization) && {
            title: c('Accounts').t`Accounts`,
            content: <ActivityMonitorEvents />,
        },
        useCanViewB2BOrganization(user, organization) && {
            title: c('Organization').t`Organization`,
            content: <OrganizationEvents />,
        },
        useCanViewGatewayMonitor(user, organization, subscription) && {
            title: c('VPN Gateways').t`VPN Gateways`,
            content: <VPNEvents />,
        },
        useCanViewPassMonitor(user, organization, subscription) && {
            title: PASS_APP_NAME,
            content: <PassEvents />,
        },
    ].filter(isTruthy);

    return (
        <SettingsSectionExtraWide>
            <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} />
        </SettingsSectionExtraWide>
    );
};

export default ActivityMonitorDashboard;
