import type { FC } from 'react';

import { c } from 'ttag';

import { usePlans } from '@proton/account/plans/hooks';
import { useUser } from '@proton/account/user/hooks';
import Price from '@proton/components/components/price/Price';
import SkeletonLoader from '@proton/components/components/skeletonLoader/SkeletonLoader';
import { getNormalizedPlanTitleToPlus } from '@proton/components/containers/payments/subscription/plusToPlusHelper';
import { useAutomaticCurrency } from '@proton/components/payments/client-extensions';
import { CYCLE, type Currency, PLANS, getPlanByName } from '@proton/payments';
import { BRAND_NAME, DARK_WEB_MONITORING_NAME } from '@proton/shared/lib/constants';

import { PostSignupOneDollarCheck } from '../PostSignupOneDollar/components/PostSignupOneDollarCheck';

export type SUPPORTED_APPS = 'proton-mail' | 'proton-drive';

const APP_PLAN_MAP: Record<SUPPORTED_APPS, PLANS> = {
    'proton-mail': PLANS.MAIL,
    'proton-drive': PLANS.DRIVE,
};

const PriceComponent: FC<{ amount: number; currency: Currency }> = ({ amount, currency }) => {
    return amount ? (
        <Price currency={currency} key="monthlyAmount" className="fancy-gradient">
            {amount}
        </Price>
    ) : (
        <SkeletonLoader width="3em" key="monthlyLoader" />
    );
};

export const useProductSpecifics = (app: SUPPORTED_APPS) => {
    const [user] = useUser();
    const [currency] = useAutomaticCurrency();
    const [plansResponse] = usePlans();

    const MB = 1024 * 1024;
    const FREE_CHECKLIST_SPACE_MB = 500;
    const hasFinishedChecklist = user.MaxSpace / MB > FREE_CHECKLIST_SPACE_MB;

    const plan = APP_PLAN_MAP[app];
    const planName = getNormalizedPlanTitleToPlus(plan);
    const planDetails = getPlanByName(plansResponse?.plans ?? [], plan, currency);
    const amountDue = (planDetails?.Pricing?.[CYCLE.YEARLY] || 0) / CYCLE.YEARLY;
    const formattedPrice = <PriceComponent amount={amountDue} currency={currency} />;

    switch (app) {
        case 'proton-mail': {
            return {
                title: c('Title').jt`Upgrade your productivity for ${formattedPrice} with ${planName}`,
                upgradeText: c('Action').t`Upgrade`,
                plan,
                planName,
                features: [
                    {
                        id: 'storage',
                        title: c('Offer feature').t`Storage`,
                        free: hasFinishedChecklist ? '1 GB' : '500 MB',
                        plus: '15 GB',
                    },
                    { id: 'addresses', title: c('Offer feature').t`Email addresses`, free: '1', plus: '10' },
                    {
                        id: 'domain',
                        title: c('Offer feature').t`Custom email domain`,
                        free: '–',
                        plus: PostSignupOneDollarCheck,
                    },
                    {
                        id: 'dwm',
                        title: (
                            <div className="flex">
                                <span>{DARK_WEB_MONITORING_NAME}</span>
                                <span className="text-sm color-weak">{c('Offer feature')
                                    .t`+10 more premium features`}</span>
                            </div>
                        ),
                        free: '–',
                        plus: PostSignupOneDollarCheck,
                    },
                ],
            };
        }
        case 'proton-drive': {
            return {
                title: c('Title').jt`Upgrade your storage for ${formattedPrice} with ${planName}`,
                upgradeText: c('Action').t`Upgrade for 200GB`,
                plan,
                planName,
                features: [
                    {
                        id: 'storage',
                        title: c('Offer feature').t`Storage`,
                        free: hasFinishedChecklist ? '5 GB' : '2 GB',
                        plus: '200 GB',
                    },
                    {
                        id: 'edit',
                        title: c('Offer feature').t`Edit docs online`,
                        free: PostSignupOneDollarCheck,
                        plus: PostSignupOneDollarCheck,
                    },
                    {
                        id: 'collaborate',
                        title: c('Offer feature').t`Collaborate with non-${BRAND_NAME} users`,
                        free: '–',
                        plus: PostSignupOneDollarCheck,
                    },
                    {
                        id: 'file_recovery',
                        title: c('Offer feature').t`File version history (over 1 week)`,
                        free: '–',
                        plus: PostSignupOneDollarCheck,
                    },
                ],
            };
        }
    }
};
