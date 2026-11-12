import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/subscriptionModalContext';
import { usePreferredPlansMap } from '@proton/payments-hooks/ui/hooks/usePreferredPlansMap';
import { CYCLE, PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { SUBSCRIPTION_STEPS } from '@proton/payments/core/subscription/subscription-modal-constants';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import { LUMO_UPGRADE_TRIGGER_CLASS } from '../../../constants';
import { sendSubscriptionModalSubscribedEvent } from '../../../util/telemetry';
import type { SkillUpgradePath } from '../../skills/useSkillLimit';

import './PluginsUpsellHero.scss';

interface PluginsUpsellHeroProps {
    headingId: string;
    maxActiveSkills: number;
    upgradePath: SkillUpgradePath;
}

export const PluginsUpsellHero = ({ headingId, maxActiveSkills, upgradePath }: PluginsUpsellHeroProps) => {
    const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();
    const { plansMapLoading } = usePreferredPlansMap();

    const handleUpgrade = () => {
        void openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            disablePlanSelection: true,
            maximumCycle: CYCLE.YEARLY,
            plan: PLANS.LUMO,
            onSubscribed: () => sendSubscriptionModalSubscribedEvent(),
        });
    };

    return (
        <header className="customize-discover-upsell flex flex-nowrap items-center gap-6 border rounded-xl p-8">
            <div className="flex flex-column flex-nowrap items-start gap-3 flex-1 min-w-0">
                <h2 className="m-0 text-3xl text-bold" id={headingId}>
                    {c('collider_2025:Title').t`More possibilities with skill sets`}
                </h2>
                <p className="m-0 text-lg text-semibold color-weak">
                    {c('collider_2025:Info').t`Write, plan, and learn with ready-made sets of skills.`}
                </p>
                <p className="m-0 color-weak">
                    {upgradePath === 'admin'
                        ? // translator: ${maxActiveSkills} is how many skills the user's plan allows turned on at once.
                          c('collider_2025:Info').ngettext(
                              msgid`Your current plan includes ${maxActiveSkills} skill and doesn't support skill sets. Ask your organization's administrator for a ${LUMO_SHORT_APP_NAME} seat to add them. Browse previews to see what they can do.`,
                              `Your current plan includes ${maxActiveSkills} skills and doesn't support skill sets. Ask your organization's administrator for a ${LUMO_SHORT_APP_NAME} seat to add them. Browse previews to see what they can do.`,
                              maxActiveSkills
                          )
                        : // translator: ${maxActiveSkills} is how many skills the user's plan allows turned on at once. ${PLAN_NAMES[PLANS.LUMO]} is the paid plan name.
                          c('collider_2025:Info').ngettext(
                              msgid`Your current plan includes ${maxActiveSkills} skill and doesn't support skill sets. Upgrade to ${PLAN_NAMES[PLANS.LUMO]} to add skill sets. Browse previews to see what they can do.`,
                              `Your current plan includes ${maxActiveSkills} skills and doesn't support skill sets. Upgrade to ${PLAN_NAMES[PLANS.LUMO]} to add skill sets. Browse previews to see what they can do.`,
                              maxActiveSkills
                          )}
                </p>
                {upgradePath === 'checkout' && (
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                        <Button
                            color="norm"
                            loading={loadingSubscriptionModal}
                            disabled={plansMapLoading}
                            onClick={handleUpgrade}
                            className={LUMO_UPGRADE_TRIGGER_CLASS}
                        >
                            {
                                // translator: Plus is the paid plan name. Do not translate.
                                c('collider_2025:Action').t`Upgrade to Plus`
                            }
                        </Button>
                    </div>
                )}
            </div>
            <div
                className="customize-discover-upsell__art hidden lg:block shrink-0 relative w-custom h-custom"
                style={{ '--w-custom': '15rem', '--h-custom': '12.5rem' }}
                aria-hidden="true"
            >
                <span
                    className="customize-discover-upsell__tile absolute top-custom start-0 z-custom flex flex-nowrap items-center justify-center w-custom h-custom border"
                    style={{
                        '--top-custom': '3.75rem',
                        '--z-custom': 2,
                        '--w-custom': '6.25rem',
                        '--h-custom': '6.25rem',
                    }}
                >
                    <LumoIcon name="WandSparkles" size={40} />
                </span>
                <span
                    className="customize-discover-upsell__tile customize-discover-upsell__tile--calendar absolute top-custom start-custom flex flex-nowrap items-center justify-center w-custom h-custom border"
                    style={{
                        '--top-custom': '1.125rem',
                        '--start-custom': '4.375rem',
                        '--w-custom': '6.25rem',
                        '--h-custom': '6.25rem',
                    }}
                >
                    <LumoIcon name="Calendar" size={40} />
                </span>
                <span
                    className="customize-discover-upsell__tile customize-discover-upsell__tile--learning absolute top-custom end-0 flex flex-nowrap items-center justify-center w-custom h-custom border"
                    style={{ '--top-custom': '4.6875rem', '--w-custom': '6.25rem', '--h-custom': '6.25rem' }}
                >
                    <LumoIcon name="BookOpen" size={40} />
                </span>
            </div>
        </header>
    );
};
