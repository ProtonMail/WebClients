import { c } from 'ttag';

import { FREE_PASS_ALIASES } from '@proton/components/containers/payments/features/pass';
import { PlanIcon } from '@proton/components/containers/payments/subscription/YourPlanSectionV2/PlanIcon';
import { usePaymentOptimistic } from '@proton/payments/ui';
import {
    APPS,
    CALENDAR_SHORT_APP_NAME,
    DRIVE_SHORT_APP_NAME,
    LUMO_SHORT_APP_NAME,
    MAIL_SHORT_APP_NAME,
    PASS_SHORT_APP_NAME,
    VPN_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';

import FeatureItem from '../FeatureItem/FeatureItem';

const PricingFeatures = () => {
    const payments = usePaymentOptimistic();
    const freePlan = payments.freePlan;

    const totalMailStorageSize = humanSize({ bytes: freePlan.MaxBaseRewardSpace, fraction: 0 });
    const totalDriveStorageSize = humanSize({ bytes: freePlan.MaxDriveRewardSpace, fraction: 0 });

    return (
        <ul className="unstyled m-0 flex flex-column gap-2">
            <FeatureItem text={c('Signup').t`Encrypted email with ${totalMailStorageSize} storage`} highlighted />
            <FeatureItem text={c('Signup').t`${FREE_PASS_ALIASES} hide-my-email aliases to fight spam`} highlighted />
            <FeatureItem text={c('Signup').t`Password-protected messages`} highlighted />
            <FeatureItem text={c('Signup').t`Secure calendar`} highlighted />
            <FeatureItem
                text={c('Signup').t`${totalDriveStorageSize} cloud storage for files and photos`}
                highlighted
            />
        </ul>
    );
};

const PricingHeader = () => {
    return (
        <header className="flex items-center gap-3 mb-2">
            <PlanIcon app={APPS.PROTONMAIL} />
            <h2 className="text-2xl text-bold">{c('Signup').t`${MAIL_SHORT_APP_NAME} Free`}</h2>
        </header>
    );
};

const PricingFooter = () => {
    return (
        <footer className="flex flex-column gap-4">
            <p className="m-0">
                {c('Signup')
                    .t`Your account includes access to free features in ${MAIL_SHORT_APP_NAME}, ${CALENDAR_SHORT_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, ${VPN_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME} and ${LUMO_SHORT_APP_NAME}.`}
            </p>
            <hr className="my-0" />
            <div className="flex justify-space-between items-center">
                <span className="text-semibold text-lg">{c('Signup').t`Total`}</span>
                <span className="text-semibold text-lg">{c('Signup').t`Free`}</span>
            </div>
        </footer>
    );
};

export const PricingCardVariantC = () => {
    return (
        <section className="w-full flex flex-column">
            <div className="rounded-xl fade-in w-full flex flex-column shadow-raised gap-4 py-6 px-6 bg-norm">
                <PricingHeader />
                <PricingFeatures />
                <PricingFooter />
            </div>
        </section>
    );
};
