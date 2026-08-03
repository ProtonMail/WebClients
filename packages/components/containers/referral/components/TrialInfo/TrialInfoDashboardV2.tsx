import { format, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { useReferralInfo } from '@proton/account/referralInfo/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { Banner } from '@proton/atoms/Banner/Banner';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { getPlanTitle, isAutoRenewTrial, isTrialRenewing } from '@proton/payments/core/subscription/helpers';
import { getTrialSubscription } from '@proton/payments/core/trials';
import { isPaidSubscription } from '@proton/payments/core/type-guards';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { dateLocale } from '@proton/shared/lib/i18n';

const TrialInfoDashboardV2 = () => {
    const [subscription] = useSubscription();
    const [referralInfo] = useReferralInfo();
    const { referrerRewardAmount } = referralInfo.uiData;

    const { PeriodEnd = 0 } = subscription || {};
    const textDate = format(fromUnixTime(PeriodEnd), 'PPP', { locale: dateLocale });
    const planTitle = getPlanTitle(subscription) || c('Referral').t`your subscription`;

    if (!isPaidSubscription(subscription)) {
        return null;
    }

    const referralTrialSubscription = getTrialSubscription([subscription], { isReferralTrial: true });
    if (!referralTrialSubscription) {
        return null;
    }

    return (
        <Banner variant="info">
            <div>
                <strong>{c('Referral').t`How your free trial works:`}</strong>{' '}
                <span className="color-norm">
                    {getBoldFormattedText(c('Referral').t`Enjoy **${planTitle}** for free until **${textDate}**.`)}
                </span>{' '}
                {!isAutoRenewTrial(referralTrialSubscription) ? (
                    <span className="color-norm">
                        {getBoldFormattedText(
                            c('Referral')
                                .t`If you subscribe before this date, you’ll get **${referrerRewardAmount}** in credits. If you don’t subscribe, you’ll be downgraded to ${BRAND_NAME} ${PLAN_NAMES[PLANS.FREE]}.`
                        )}
                    </span>
                ) : null}
                {isAutoRenewTrial(referralTrialSubscription) && isTrialRenewing(referralTrialSubscription) ? (
                    <span className="color-norm">
                        {getBoldFormattedText(
                            c('Referral')
                                .t`If you cancel before then, you will be downgraded to ${BRAND_NAME} ${PLAN_NAMES[PLANS.FREE]} when the trial ends. If you don’t cancel, your full plan will start and you’ll get **${referrerRewardAmount}** in credits.`
                        )}
                    </span>
                ) : null}
            </div>
        </Banner>
    );
};

export default TrialInfoDashboardV2;
