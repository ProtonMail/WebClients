import { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { ModalProps, ModalTwo, ModalTwoContent, ModalTwoHeader } from '@proton/components';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { Plan, PlansMap } from '@proton/shared/lib/interfaces';

import PlanComparison from './PlanComparison';

interface Props extends Omit<ModalProps, 'title'> {
    title: ReactNode;
    currentPlan: Plan | undefined;
    upsellPlan: Plan | undefined;
    unlockPlan: Plan | undefined;
    relativePrice: string;
    free: string;
    plansMap: PlansMap;
    onUpgrade: () => void;
    onFree: () => void;
}

const UnlockModal = ({
    title,
    currentPlan,
    unlockPlan,
    upsellPlan,
    relativePrice,
    free,
    plansMap,
    onUpgrade,
    onFree,
    ...rest
}: Props) => {
    const currentPlanTitle = currentPlan?.Title || '';
    const unlockPlanTitle = unlockPlan?.Title || '';
    const upsellPlanTitle = upsellPlan?.Title || '';
    return (
        <ModalTwo {...rest} size="small" disableCloseOnEscape={true}>
            <ModalTwoHeader title={title} className="text-center" hasClose={false} />
            <ModalTwoContent className="text-center">
                <div className="mb-2 color-weak">
                    {c('pass_signup_2023: Info')
                        .t`The offer you selected is not available for ${currentPlanTitle} subscribers.`}
                </div>
                <div className="mb-4 color-weak">
                    {getBoldFormattedText(
                        c('pass_signup_2023: Info')
                            .t`But you can unlock **${unlockPlanTitle}** and all premium ${BRAND_NAME} services by upgrading to **${upsellPlanTitle}** — it’s just ${relativePrice} extra per month.`
                    )}
                </div>
                <PlanComparison
                    currentPlan={currentPlan}
                    upsellPlan={upsellPlan}
                    unlockPlan={unlockPlan}
                    plansMap={plansMap}
                >
                    <Button color="norm" fullWidth className="mb-1" onClick={onUpgrade}>
                        {c('pass_signup_2023: Action').t`Upgrade for only ${relativePrice} extra per month`}
                    </Button>
                    <Button shape="ghost" color="norm" fullWidth onClick={onFree}>
                        {c('pass_signup_2023: Action').t`Use ${free} instead`}
                    </Button>
                </PlanComparison>
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default UnlockModal;
