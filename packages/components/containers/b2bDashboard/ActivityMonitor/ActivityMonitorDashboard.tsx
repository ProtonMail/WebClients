import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { Tabs } from '@proton/components/components/tabs/Tabs';
import { getIsB2BAudienceFromPlan } from '@proton/payments/core/plan/helpers';
import {
    type MaybeFreeSubscription,
    hasAnyB2bBundle,
    hasPassBusiness,
    hasVPNPassProfessional,
    hasVpnBusiness,
} from '@proton/payments/core/subscription/helpers';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { hasOrganizationSetup, hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import SettingsSectionExtraWide from '../../account/SettingsSectionExtraWide';
import { OrganizationEvents } from '../Organization/OrganizationEvents';
import { PassEvents } from '../Pass/PassEvents';
import { VPNEvents } from '../VPN/VPNEvents';
import ActivityMonitorEvents from './ActivityMonitorEvents';

interface Props {
    organization?: OrganizationExtended;
    subscription: MaybeFreeSubscription;
}

const getTabPermissions = (subscription: MaybeFreeSubscription, organization: OrganizationExtended | undefined) => {
    const hasOrganizationSetupOrKey = hasOrganizationSetupWithKeys(organization) || hasOrganizationSetup(organization);
    const isB2B = getIsB2BAudienceFromPlan(organization?.PlanName);
    const hasPlanWithEventLogging =
        hasVpnBusiness(subscription) || hasAnyB2bBundle(subscription) || hasVPNPassProfessional(subscription);
    const hasPassOrBundleB2B = hasPassBusiness(subscription) || hasAnyB2bBundle(subscription);

    return {
        canDisplayAccountEvents: hasOrganizationSetupOrKey || isB2B,
        canDisplayB2BOrganizationEvents: hasOrganizationSetupOrKey,
        canDisplayB2BLogsVPN: hasPlanWithEventLogging && !!organization,
        canDisplayB2BLogsPass: hasPassOrBundleB2B && !!organization,
    };
};

const ActivityMonitorDashboard = ({ organization, subscription }: Props) => {
    const [activeTab, setActiveTab] = useState(0);
    const tabPermissions = useMemo(() => getTabPermissions(subscription, organization), [subscription, organization]);

    const tabs = useMemo(
        () =>
            [
                tabPermissions.canDisplayAccountEvents && {
                    title: c('Accounts').t`Accounts`,
                    content: <ActivityMonitorEvents />,
                },
                tabPermissions.canDisplayB2BOrganizationEvents && {
                    title: c('Organization').t`Organization`,
                    content: <OrganizationEvents />,
                },
                tabPermissions.canDisplayB2BLogsVPN && {
                    title: c('VPN Gateways').t`VPN Gateways`,
                    content: <VPNEvents />,
                },
                tabPermissions.canDisplayB2BLogsPass && {
                    title: PASS_APP_NAME,
                    content: <PassEvents upgradeRequired={false} />,
                },
            ].filter(isTruthy),
        [tabPermissions]
    );

    return (
        <SettingsSectionExtraWide>
            <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} />
        </SettingsSectionExtraWide>
    );
};

export default ActivityMonitorDashboard;
