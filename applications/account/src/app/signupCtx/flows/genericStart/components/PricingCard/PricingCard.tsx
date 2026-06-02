import { c, msgid } from 'ttag';

import { AppsLogos } from '@proton/components';
import { usePaymentOptimistic } from '@proton/payments/ui';
import { MAX_CALENDARS_FREE } from '@proton/shared/lib/calendar/constants';
import { APPS } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import clsx from '@proton/utils/clsx';
import { VPN_SERVERS } from '@proton/vpn/constants/vpnServers';

import FeatureItem from '../FeatureItem/FeatureItem';

export type PricingStep = 'account-details' | 'payment';

const PricingFeatures = () => {
    const payments = usePaymentOptimistic();
    const freePlan = payments.freePlan;

    const totalMailStorageSize = humanSize({ bytes: freePlan.MaxBaseRewardSpace, fraction: 0 });
    const totalDriveStorageSize = humanSize({ bytes: freePlan.MaxDriveRewardSpace, fraction: 0 });
    const maxAddresses = freePlan.MaxAddresses || 1;
    const maxCalendars = freePlan.MaxCalendars || MAX_CALENDARS_FREE;

    return (
        <div className="px-4 lg:px-8">
            <ul className="unstyled m-0 flex flex-column gap-2">
                <FeatureItem text={c('Signup').t`Encrypted email with ${totalMailStorageSize} storage`} highlighted />
                <FeatureItem
                    text={[
                        c('Signup').ngettext(msgid`${maxAddresses} address`, `${maxAddresses} addresses`, maxAddresses),
                        c('Signup').ngettext(
                            msgid`${maxCalendars} calendar`,
                            `${maxCalendars} calendars`,
                            maxCalendars
                        ),
                    ].join(', ')}
                    highlighted
                />
                <FeatureItem
                    text={c('Signup').ngettext(
                        msgid`${VPN_SERVERS.free.servers}+ VPN servers in ${VPN_SERVERS.free.countries} country`,
                        `${VPN_SERVERS.free.servers}+ VPN servers in ${VPN_SERVERS.free.countries} countries`,
                        VPN_SERVERS.free.countries
                    )}
                    highlighted
                />
                <FeatureItem
                    text={c('Signup').t`${totalDriveStorageSize} cloud storage for files and photos`}
                    highlighted
                />
                <FeatureItem text={c('Signup').t`Collaborative documents and spreadsheets`} highlighted />
                <FeatureItem text={c('Signup').t`Password manager for all your devices`} highlighted />
                <FeatureItem text={c('Signup').t`Private AI assistant with encrypted chat history`} highlighted />
            </ul>
        </div>
    );
};

const PricingHeader = () => {
    return (
        <>
            <header className="flex flex-column gap-4 px-4 lg:px-8">
                <h2 className="font-arizona text-2xl">{c('Signup').t`Every free account comes with:`}</h2>
                <div className="block lg:hidden">
                    <AppsLogos
                        fullWidth
                        logoSize={8}
                        apps={[
                            APPS.PROTONMAIL,
                            APPS.PROTONCALENDAR,
                            APPS.PROTONVPN_SETTINGS,
                            APPS.PROTONDRIVE,
                            APPS.PROTONPASS,
                            APPS.PROTONLUMO,
                        ]}
                    />
                </div>
                <div className="hidden lg:block">
                    <AppsLogos
                        fullWidth
                        iconShape="appIcon"
                        logoSize={8}
                        apps={[
                            APPS.PROTONMAIL,
                            APPS.PROTONCALENDAR,
                            APPS.PROTONVPN_SETTINGS,
                            APPS.PROTONDRIVE,
                            APPS.PROTONPASS,
                            APPS.PROTONLUMO,
                        ]}
                    />
                </div>
            </header>
        </>
    );
};

export const PricingCard = () => {
    return (
        <section className={clsx('generic-signup-pricing-card w-full flex flex-column')}>
            <div className="generic-signup-pricing-card-inner rounded-xl fade-in w-full flex flex-column shadow-raised gap-4 lg:gap-8 py-4 lg:py-8 bg-norm">
                <PricingHeader />
                <hr className="mx-4 lg:mx-8 my-0" />
                <PricingFeatures />
            </div>
        </section>
    );
};
