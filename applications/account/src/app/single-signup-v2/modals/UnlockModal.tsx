import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoHeader } from '@proton/components';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { getCheckout } from '@proton/shared/lib/helpers/checkout';
import type { Plan, PlansMap, SubscriptionPlan } from '@proton/shared/lib/interfaces';

import type { SubscriptionData } from '../../signup/interfaces';
import PlanComparison from './PlanComparison';

interface Props extends Omit<ModalProps, 'title'> {
    title: ReactNode;
    dark: boolean;
    currentPlan: SubscriptionPlan | undefined;
    upsellPlan: Plan | undefined;
    unlockPlan: Plan | undefined;
    relativePrice: string | undefined;
    appName: string;
    plansMap: PlansMap;
    subscriptionData: SubscriptionData | undefined;
    onUpgrade: () => void;
    onFree: () => void;
}

const UnlockModal = ({
    title,
    dark,
    currentPlan,
    unlockPlan,
    upsellPlan,
    relativePrice,
    appName,
    subscriptionData,
    plansMap,
    onUpgrade,
    onFree,
    ...rest
}: Props) => {
    const currentPlanTitle = currentPlan?.Title || '';
    const unlockPlanTitle = unlockPlan?.Title || '';
    const upsellPlanTitle = upsellPlan?.Title || '';
    const checkout = subscriptionData
        ? getCheckout({
              planIDs: subscriptionData.planIDs,
              plansMap,
              checkResult: subscriptionData.checkResult,
          })
        : undefined;
    return (
        <ModalTwo {...rest} size="small" disableCloseOnEscape={true}>
            <ModalTwoHeader title={title} className="text-center" hasClose={false} />
            <ModalTwoContent className="text-center">
                <div className="mb-2 color-weak">
                    {c('pass_signup_2023: Info')
                        .t`The offer you selected is not available for ${currentPlanTitle} subscribers.`}
                </div>
                {(() => {
                    const hasUnlockPlan = hasBit(currentPlan?.Services, unlockPlan?.Services || 0);
                    return (
                        <div className="mb-4 color-weak">
                            {(() => {
                                if (hasUnlockPlan && checkout) {
                                    const discount = `${checkout.discountPercent}%`;
                                    if (relativePrice) {
                                        return getBoldFormattedText(
                                            c('pass_signup_2023: Info')
                                                .t`But you can get ${discount} off by upgrading to **${upsellPlanTitle}** — it’s just ${relativePrice} extra per month.`
                                        );
                                    }
                                    return getBoldFormattedText(
                                        c('pass_signup_2023: Info')
                                            .t`But you can get ${discount} off by upgrading to **${upsellPlanTitle}**.`
                                    );
                                }
                                if (relativePrice) {
                                    return getBoldFormattedText(
                                        c('pass_signup_2023: Info')
                                            .t`But you can unlock **${unlockPlanTitle}** and all premium ${BRAND_NAME} services by upgrading to **${upsellPlanTitle}** — it’s just ${relativePrice} extra per month.`
                                    );
                                }
                                return getBoldFormattedText(
                                    c('pass_signup_2023: Info')
                                        .t`But you can unlock **${unlockPlanTitle}** and all premium ${BRAND_NAME} services by upgrading to **${upsellPlanTitle}**.`
                                );
                            })()}
                        </div>
                    );
                })()}
                <PlanComparison
                    dark={dark}
                    currentPlan={currentPlan}
                    upsellPlan={upsellPlan}
                    unlockPlan={unlockPlan}
                    plansMap={plansMap}
                >
                    <Button color="norm" fullWidth className="mb-1" onClick={onUpgrade}>
                        {c('pass_signup_2023: Action').t`Upgrade`}
                    </Button>
                    <Button shape="ghost" color="norm" fullWidth onClick={onFree}>
                        {c('pass_signup_2023: Action').t`Continue to ${appName} without upgrading`}
                    </Button>
                </PlanComparison>
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default UnlockModal;
