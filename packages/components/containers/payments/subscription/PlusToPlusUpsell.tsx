import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { PLANS } from '@proton/payments/core/constants';
import type { Plan, PlansMap } from '@proton/payments/core/plan/interface';
import { getPlan } from '@proton/payments/core/subscription/helpers';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import ModalTwo, { type ModalProps } from '../../../components/modalTwo/Modal';
import ModalTwoContent from '../../../components/modalTwo/ModalContent';
import ModalTwoHeader from '../../../components/modalTwo/ModalHeader';
import getBoldFormattedText from '../../../helpers/getBoldFormattedText';
import { useTheme } from '../../themes/ThemeProvider';
import PlusUnlimitedComparison from './PlusUnlimitedComparison';
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
