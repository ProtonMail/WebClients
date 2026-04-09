import { c } from 'ttag';

import { AppsLogos } from '@proton/components';
import { usePaymentOptimistic } from '@proton/payments/ui';
import { APPS } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import clsx from '@proton/utils/clsx';

import FeatureItem from '../FeatureItem/FeatureItem';

const PricingFeatures = () => {
    const payments = usePaymentOptimistic();
    const freePlan = payments.freePlan;
    const vpnServersCountData = payments.vpnServersCountData;

    const totalMailStorageSize = humanSize({ bytes: freePlan.MaxBaseRewardSpace, fraction: 0 });
    const totalDriveStorageSize = humanSize({ bytes: freePlan.MaxDriveRewardSpace, fraction: 0 });

    return (
        <div className="px-4 lg:px-8">
            <ul className="unstyled m-0 flex flex-column gap-2">
                <FeatureItem text={c('Signup').t`Encrypted email with ${totalMailStorageSize} storage`} highlighted />
                <FeatureItem
                    text={c('Signup').t`VPN with servers in ${vpnServersCountData.free.countries} countries`}
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

export const PricingCardVariantA = () => {
    return (
        <section className={clsx('w-full flex flex-column')}>
            <div className="rounded-xl fade-in w-full flex flex-column shadow-raised gap-4 lg:gap-8 py-4 lg:py-8 bg-norm">
                <PricingHeader />
                <hr className="mx-4 lg:mx-8 my-0" />
                <PricingFeatures />
            </div>
        </section>
    );
};
