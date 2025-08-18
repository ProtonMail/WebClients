import { type ReactElement } from 'react';

import { c } from 'ttag';

import { Tooltip } from '@proton/atoms';
import Time from '@proton/components/components/time/Time';
import { IcCheckmark, IcClockCircleFilled, IcGlobe, IcMobile, IcServers, IcStorage, IcUserFilled } from '@proton/icons';
import { type Subscription } from '@proton/payments';
import { getVPNDedicatedIPs } from '@proton/payments';
import { DRIVE_SHORT_APP_NAME, FREE_VPN_CONNECTIONS, MAIL_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import type { UserModel, VPNServersCountData } from '@proton/shared/lib/interfaces';
import { getSpace } from '@proton/shared/lib/user/storage';
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

export const ServersSection = ({ subscription }: { subscription?: Subscription }) => {
    const servers = getVPNDedicatedIPs(subscription);
    if (servers === 0) {
        return false;
    }
    return (
        <FeatureElement
            icon={<IcServers className="shrink-0" />}
            title={c('Info').t`Dedicated servers`}
            text={`${servers}`}
        />
    );
};

export const StorageSection = ({
    user,
    usedSpace,
    maxSpace,
}: {
    user: UserModel;
    usedSpace: number;
    maxSpace: number;
}) => {
    const space = getSpace(user);

    // don't show storage section for plans with storage split for now
    if (space.splitStorage) {
        return false;
    }

    const storageText = (() => {
        const BASE = 1000;
        const TB = BASE * BASE * BASE * BASE;

        if (!space.splitStorage) {
            const unit = maxSpace >= TB ? 'TB' : 'GB';
            const humanUsedSpace = humanSize({ bytes: usedSpace, unit: unit });
            const humanMaxSpace = humanSize({ bytes: maxSpace, unit: unit, fraction: 0 });
            return c('Label').t`${humanUsedSpace} of ${humanMaxSpace}`;
        }

        const maxBaseSpace = humanSize({ bytes: space.maxBaseSpace, unit: 'GB', fraction: 0 });
        const maxDriveSpace = humanSize({ bytes: space.maxDriveSpace, unit: 'GB', fraction: 0 });
        const humanMaxSpace = humanSize({ bytes: space.maxBaseSpace + space.maxDriveSpace, unit: 'GB', fraction: 0 });

        return (
            <div>
                <span>{humanMaxSpace}</span>
                <div className="text-sm">
                    {maxBaseSpace} {MAIL_SHORT_APP_NAME} + {maxDriveSpace} {DRIVE_SHORT_APP_NAME}
                </div>
            </div>
        );
    })();

    const tooltipText = (() => {
        const humanUsedSpace = humanSize({ bytes: usedSpace });
        const humanMaxSpace = humanSize({ bytes: maxSpace, fraction: 0 });
        return c('Label').t`${humanUsedSpace} of ${humanMaxSpace}`;
    })();

    return (
        <FeatureElement
            icon={<IcStorage className="shrink-0" />}
            title={c('Info').t`Storage`}
            text={storageText}
            tooltipText={tooltipText}
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
}: {
    serversCount: VPNServersCountData | undefined;
    isFreeUser: boolean;
}) => {
    if (!isFreeUser || !serversCount) {
        return false;
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
