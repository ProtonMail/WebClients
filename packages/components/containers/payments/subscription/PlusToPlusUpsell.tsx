import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { Button } from '@proton/atoms';
import ModalTwo, { type ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import PlusUnlimitedComparison from '@proton/components/containers/payments/subscription/PlusUnlimitedComparison';
import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { PLANS, type Plan, type PlansMap, getPlan } from '@proton/payments';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import { getNormalizedPlanTitles } from './plusToPlusHelper';

interface Props extends Omit<ModalProps, 'title' | 'onClose'> {
    onUpgrade: () => void;
    plansMap: PlansMap;
    unlockPlan: Plan | undefined;
    onClose: () => void;
}

const PlusToPlusUpsell = ({ plansMap, unlockPlan, onUpgrade, ...rest }: Props) => {
    const br = <br key="br" />;
    const { information } = useTheme();
    const [subscription] = useSubscription();
    const currentPlan = getPlan(subscription);
    const upsellPlan = plansMap[PLANS.BUNDLE];

    const { currentPlanTitle, upsellPlanTitle, unlockPlanTitle } = getNormalizedPlanTitles({
        currentPlan,
        unlockPlan,
        upsellPlan,
    });

    return (
        <ModalTwo {...rest} size="small" data-testid="plus-block">
            <ModalTwoHeader
                title={c('plus_block').jt`More ${BRAND_NAME} services.${br}One easy subscription.`}
                className="text-center"
                hasClose={false}
            />
            <ModalTwoContent className="text-center">
                <div className="mb-4 color-weak">
                    {getBoldFormattedText(
                        c('plus_block')
                            .t`As a **${currentPlanTitle}** subscriber, you can unlock **${unlockPlanTitle}** and more ${BRAND_NAME} services by upgrading to **${upsellPlanTitle}**.`
                    )}
                </div>
                <PlusUnlimitedComparison
                    dark={information.dark}
                    currentPlan={currentPlan}
                    upsellPlan={upsellPlan}
                    unlockPlan={unlockPlan}
                    plansMap={plansMap}
                >
                    <Button color="norm" fullWidth className="mb-1" onClick={() => onUpgrade()}>
                        {c('plus_block').t`Upgrade to ${upsellPlanTitle}`}
                    </Button>
                    <Button shape="ghost" color="norm" fullWidth onClick={rest.onClose}>
                        {c('plus_block').t`Stay on ${currentPlanTitle}`}
                    </Button>
                </PlusUnlimitedComparison>
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default PlusToPlusUpsell;
