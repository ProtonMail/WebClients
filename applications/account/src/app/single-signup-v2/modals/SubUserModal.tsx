import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoHeader } from '@proton/components';
import { useLoading } from '@proton/hooks';
import type { Plan, PlansMap, SubscriptionPlan } from '@proton/shared/lib/interfaces';

import { getFreeTitle } from '../helper';
import PlanComparison from './PlanComparison';

interface Props extends ModalProps {
    appName: string;
    plansMap: PlansMap;
    dark: boolean;
    currentPlan: SubscriptionPlan | undefined;
    upsellPlan: Plan | undefined;
    unlockPlan: Plan | undefined;
    onContinue: () => void;
    onSignOut: () => Promise<void>;
}

const SubUserModal = ({
    appName,
    dark,
    currentPlan,
    unlockPlan,
    plansMap,
    onContinue,
    onClose,
    onSignOut,
    upsellPlan,
    ...rest
}: Props) => {
    const free = getFreeTitle(appName);
    const [loading, withLoading] = useLoading();
    return (
        <ModalTwo {...rest} size="small">
            <ModalTwoHeader
                title={c('pass_signup_2023: Title').t`Request your organization administrator to upgrade`}
                className="text-center"
                hasClose={false}
            />
            <ModalTwoContent className="text-center">
                <div className="mb-4 color-weak">
                    {c('pass_signup_2023: Info')
                        .t`Your organization has access to ${free}. If you want to access premium ${appName} features, please ask your organization's administrator to upgrade.`}
                </div>
                <PlanComparison
                    dark={dark}
                    plansMap={plansMap}
                    upsellPlan={upsellPlan}
                    currentPlan={currentPlan}
                    unlockPlan={unlockPlan}
                >
                    <Button
                        color="norm"
                        fullWidth
                        className="mb-2"
                        onClick={() => {
                            onContinue();
                            onClose?.();
                        }}
                    >
                        {c('pass_signup_2023: Action').t`Continue to ${free}`}
                    </Button>
                    <Button
                        shape="ghost"
                        color="norm"
                        loading={loading}
                        onClick={async () => {
                            await withLoading(onSignOut().then(() => onClose?.()));
                        }}
                        fullWidth
                    >
                        {c('pass_signup_2023: Action').t`Create another account instead`}
                    </Button>
                </PlanComparison>
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default SubUserModal;
