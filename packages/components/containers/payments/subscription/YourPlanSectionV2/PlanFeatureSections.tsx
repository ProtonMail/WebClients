import type { ReactElement } from 'react';

import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Time from '@proton/components/components/time/Time';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcClockCircleFilled } from '@proton/icons/icons/IcClockCircleFilled';
import { IcGlobe } from '@proton/icons/icons/IcGlobe';
import { IcMobile } from '@proton/icons/icons/IcMobile';
import { IcServers } from '@proton/icons/icons/IcServers';
import { IcUserFilled } from '@proton/icons/icons/IcUserFilled';
import type { Subscription } from '@proton/payments';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, FREE_VPN_CONNECTIONS } from '@proton/shared/lib/constants';
import type { Organization, VPNServersCountData } from '@proton/shared/lib/interfaces';
import { getAutoSelectFromCountries, getCountriesWithoutPlus, getVpnDevices } from '@proton/shared/lib/vpn/features';

import { subscriptionExpires } from '../helpers';

const FeatureElement = ({
    icon,
    title,
    text,
    tooltipText,
}: {
    icon: ReactElement;
    title: string;
    text: string | ReactElement;
    tooltipText?: string | ReactElement;
}) => {
    return (
        <Tooltip title={tooltipText}>
            <div className="flex flex-nowrap gap-2 items-center">
                <div className="bg-lowered color-hint rounded flex items-center justify-center p-2 ratio-square shrink-0">
                    {icon}
                </div>
                <p className="m-0 flex flex-column">
                    <span className="text-sm color-hint">{title}</span>
                    <span className="sr-only">:</span>
                    <span className="text-semibold text-sm">{text}</span>
                </p>
            </div>
        </Tooltip>
    );
};

export const UsersSection = ({ MaxMembers, userText }: { MaxMembers: number; userText: string | null }) => {
    if (MaxMembers === 1 || !userText) {
        return false;
    }
    return <FeatureElement icon={<IcUserFilled className="shrink-0" />} title={c('Info').t`Users`} text={userText} />;
};

export const ServersSection = ({ organization, app }: { organization?: Organization; app: APP_NAMES }) => {
    const servers = organization?.MaxDedicatedIPs ?? 0;
    if (app !== APPS.PROTONVPN_SETTINGS || servers === 0) {
        return null;
    }
    return (
        <FeatureElement
            icon={<IcServers className="shrink-0" />}
            title={c('Info').t`Dedicated servers`}
            text={`${servers}`}
        />
    );
};

export const BillingDateSection = ({ subscription }: { subscription: Subscription }) => {
    const { renewDisabled } = subscriptionExpires(subscription);

    if (!subscription?.PeriodEnd) {
        return false;
    }

    const formattedPeriodEndDate = (
        <Time format="PP" key="period-end" data-testid="period-end">
            {subscription?.PeriodEnd}
        </Time>
    );

    const titleText = renewDisabled ? c('Info').t`End date` : c('Info').t`Next billing date`;

    return (
        <FeatureElement
            icon={<IcClockCircleFilled className="shrink-0" />}
            title={titleText}
            text={formattedPeriodEndDate}
        />
    );
};

export const FreeVPNFeatures = ({
    serversCount,
    isFreeUser,
    app,
}: {
    serversCount: VPNServersCountData | undefined;
    isFreeUser: boolean;
    app: APP_NAMES;
}) => {
    if (app !== APPS.PROTONVPN_SETTINGS || !isFreeUser || !serversCount) {
        return null;
    }
    return (
        <ul className="m-0 unstyled flex flex-nowrap gap-4">
            <li className="flex flex-nowrap gap-1 items-center">
                <IcGlobe className="color-success shrink-0" />
                {getCountriesWithoutPlus(serversCount.free.countries)}
            </li>
            <li className="flex flex-nowrap gap-1 items-center">
                <IcMobile className="color-success shrink-0" />
                {getVpnDevices(FREE_VPN_CONNECTIONS)}
            </li>
        </ul>
    );
};

export const FreeVPNFeaturesB = ({ serversCount }: { serversCount: VPNServersCountData | undefined }) => {
    if (!serversCount) {
        return false;
    }
    return (
        <ul className="m-0 unstyled px-2 flex flex-column flex-nowrap gap-3">
            <li className="flex flex-nowrap gap-1 items-center">
                <IcCheckmark size={6} className="color-success shrink-0" />
                {getAutoSelectFromCountries(serversCount.free.countries)}
            </li>
            <li className="flex flex-nowrap gap-1 items-center">
                <IcCheckmark size={6} className="color-success shrink-0" />
                {getVpnDevices(FREE_VPN_CONNECTIONS)}
            </li>
        </ul>
    );
};
