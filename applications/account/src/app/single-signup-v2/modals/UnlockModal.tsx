import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalProps } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoHeader } from '@proton/components';
import PlusUnlimitedComparison from '@proton/components/containers/payments/subscription/PlusUnlimitedComparison';
import { getNormalizedPlanTitles } from '@proton/components/containers/payments/subscription/plusToPlusHelper';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import type { Plan, PlansMap, SubscriptionPlan } from '@proton/payments';
import { getCheckoutUi } from '@proton/payments/core/checkout';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';

import type { SubscriptionData } from '../../signup/interfaces';

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
    const { currentPlanTitle, upsellPlanTitle, unlockPlanTitle } = getNormalizedPlanTitles({
        currentPlan,
        unlockPlan,
        upsellPlan,
    });

    const checkout = subscriptionData
        ? getCheckoutUi({
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
                    {getBoldFormattedText(
                        c('pass_signup_2023: Info')
                            .t`The offer you selected is not available for **${currentPlanTitle}** subscribers.`
                    )}
                </div>
                {(() => {
                    const hasUnlockPlan = hasBit(currentPlan?.Services, unlockPlan?.Services || 0);
                    return (
                        <div className="mb-4 color-weak">
                            {(() => {
                                if (hasUnlockPlan && checkout) {
                                    const discountPercentString = `${checkout.discountPercent}%`;
                                    if (relativePrice) {
                                        if (checkout.discountPercent !== 0) {
                                            return getBoldFormattedText(
                                                c('pass_signup_2023: Info')
                                                    .t`But you can get ${discountPercentString} off by upgrading to **${upsellPlanTitle}** — it’s just ${relativePrice} extra per month.`
                                            );
                                        } else {
                                            return getBoldFormattedText(
                                                c('pass_signup_2023: Info')
                                                    .t`But you can upgrade to **${upsellPlanTitle}** — it’s just ${relativePrice} extra per month.`
                                            );
                                        }
                                    }

                                    if (checkout.discountPercent !== 0) {
                                        return getBoldFormattedText(
                                            c('pass_signup_2023: Info')
                                                .t`But you can get ${discountPercentString} off by upgrading to **${upsellPlanTitle}**.`
                                        );
                                    } else {
                                        return getBoldFormattedText(
                                            c('pass_signup_2023: Info')
                                                .t`But you can upgrade to **${upsellPlanTitle}**.`
                                        );
                                    }
                                }
                                if (relativePrice) {
                                    return getBoldFormattedText(
                                        c('pass_signup_2023: Info')
                                            .t`But you can unlock **${unlockPlanTitle}** and more ${BRAND_NAME} services by upgrading to **${upsellPlanTitle}** — it’s just ${relativePrice} extra per month.`
                                    );
                                }
                                return getBoldFormattedText(
                                    c('pass_signup_2023: Info')
                                        .t`But you can unlock **${unlockPlanTitle}** and more ${BRAND_NAME} services by upgrading to **${upsellPlanTitle}**.`
                                );
                            })()}
                        </div>
                    );
                })()}
                <PlusUnlimitedComparison
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
                </PlusUnlimitedComparison>
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default UnlockModal;
