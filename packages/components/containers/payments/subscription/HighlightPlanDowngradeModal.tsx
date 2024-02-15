import { c, msgid } from 'ttag';

import { Button, Card } from '@proton/atoms';
import useFlag from '@proton/components/containers/unleash/useFlag';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { ProductParam } from '@proton/shared/lib/apps/product';
import { BRAND_NAME, PLANS } from '@proton/shared/lib/constants';
import { getDifferenceInDays } from '@proton/shared/lib/date/date';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { FreePlanDefault, PlansMap, UserModel } from '@proton/shared/lib/interfaces';
import { getSpace } from '@proton/shared/lib/user/storage';

import {
    Form,
    Icon,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    ModalProps,
} from '../../../components';
import { ShortPlan } from '../features/interface';
import { getFreePlan } from '../features/plan';
import SubscriptionCancelPlan from './SubscriptionCancelPlan';

export interface HighlightPlanDowngradeModalOwnProps {
    shortPlan: ShortPlan;
    periodEnd: number;
    plansMap: PlansMap;
    user: UserModel;
    app: ProductParam;
    freePlan: FreePlanDefault;
}

interface HighlightPlanDowngradeModalProps
    extends Omit<ModalProps<typeof Form>, 'onSubmit'>,
        HighlightPlanDowngradeModalOwnProps {
    onConfirm: () => void;
}

const HighlightPlanDowngradeModal = ({
    freePlan,
    app,
    user,
    plansMap,
    onConfirm,
    onClose,
    shortPlan,
    periodEnd,
    ...rest
}: HighlightPlanDowngradeModalProps) => {
    const storageSplitEnabled = useFlag('SplitStorage');
    const downgradedShortPlan = getFreePlan(freePlan);
    const downgradedPlanName = `${downgradedShortPlan.title}`;
    const currentPlanName = shortPlan.title;

    const space = getSpace(user, storageSplitEnabled);
    const storageError =
        storageSplitEnabled &&
        (space.usedBaseSpace >= freePlan.MaxBaseSpace || space.usedDriveSpace >= freePlan.MaxDriveSpace);

    const daysRemaining = getDifferenceInDays(new Date(), new Date(periodEnd * 1000));

    // translator: daysRemaining contains the number of days remaining for the current subscription eg 288 days remaining
    const planTimeRemainingString = getBoldFormattedText(
        c('storage_split: info').ngettext(
            msgid`You still have **${daysRemaining}** day left on your **${currentPlanName}** plan.`,
            `You still have **${daysRemaining}** days left on your **${currentPlanName}** plan.`,
            daysRemaining
        )
    );

    // translator: will be something like "Downgrade to Proton Free" (where "Free" is the plan name)
    const downgradeButtonString = c('new_plans: Action').t`Downgrade to ${downgradedPlanName}`;

    // translator: "Keep Mail Plus"
    const keepButtonString = c('storage_split: action').t`Keep ${currentPlanName}`;

    const shortPlanFeatures = shortPlan?.features?.filter((feature) => !feature.hideInDowngrade) || [];

    return (
        <Modal as={Form} onClose={onClose} size="xlarge" data-testid="highlight-downgrade-modal" {...rest}>
            <ModalHeader title={c('Title').t`Downgrade to ${downgradedPlanName}?`} />
            <ModalContent>
                {(() => {
                    const result = (() => {
                        if (storageError) {
                            return (
                                <div>
                                    {daysRemaining > 0 && <div className="mb-8 mt-2">{planTimeRemainingString}</div>}

                                    <div
                                        className="bg-danger p-2 rounded flex gap-2 color-norm"
                                        style={{
                                            backgroundColor: 'var(--signal-danger-minor-2)',
                                        }}
                                    >
                                        <div className="shrink-0">
                                            <Icon name="exclamation-circle-filled" className="color-danger" />
                                        </div>
                                        <div className="flex-1">
                                            {c('Info')
                                                .t`You are using more storage than what is included in a ${downgradedPlanName} plan. Please delete or remove data in order to downgrade.`}
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                        if (shortPlan.plan === PLANS.MAIL) {
                            return c('storage_split: info')
                                .t`You’ll lose access to additional storage, email addresses, aliases, calendars, as well as priority support.`;
                        }
                        if (shortPlan.plan === PLANS.DRIVE) {
                            const gb = humanSize({ bytes: plansMap[PLANS.DRIVE]?.MaxSpace });
                            return c('storage_split: info')
                                .t`You’ll lose access to ${gb} storage and priority support.`;
                        }
                        if (shortPlan.plan === PLANS.PASS_PLUS) {
                            return c('storage_split: info')
                                .t`You’ll lose access to unlimited logins and notes, unlimited hide-my-email aliases, 20 vaults, as well as priority support.`;
                        }
                        if (shortPlan.plan === PLANS.VPN) {
                            return c('storage_split: info')
                                .t`You’ll lose access to the highest VPN speed, protection for 10 devices, high-speed streaming, ad-blocker and malware protection, as well as priority support.`;
                        }
                        return c('storage_split: info')
                            .t`By downgrading you will lose the following benefits. Are you sure you want to proceed?`;
                    })();
                    if (result) {
                        return <div className="pb-8">{result}</div>;
                    }
                })()}
                <div className="flex flex-row flex-nowrap flex-column md:flex-row gap-6">
                    <SubscriptionCancelPlan
                        name={currentPlanName}
                        info={shortPlan?.description || ''}
                        features={shortPlanFeatures}
                        className="md:flex-1"
                        downgrade
                    />
                    <SubscriptionCancelPlan
                        name={downgradedPlanName}
                        info={downgradedShortPlan?.description || ''}
                        features={downgradedShortPlan.features}
                        className="md:flex-1"
                    />
                </div>
                {!storageError && daysRemaining > 0 && (
                    <Card className="mb-6 mt-8 flex flex-row flex-nowrap gap-1" rounded>
                        <div className="shrink-0">
                            <Icon name="hourglass" />
                        </div>
                        <div>
                            {planTimeRemainingString}{' '}
                            {c('storage_split: info')
                                .t`We’ll add the credits for the remaining time to your ${BRAND_NAME} Account.`}
                        </div>
                    </Card>
                )}
            </ModalContent>
            <ModalFooter>
                <Button
                    className="w-full md:w-auto mb-4 md:mb-0"
                    disabled={storageError}
                    onClick={() => {
                        onConfirm();
                        onClose?.();
                    }}
                    data-testid="highlight-downgrade-to-free"
                >
                    {downgradeButtonString}
                </Button>
                <Button className="w-full md:w-auto" color="norm" onClick={onClose}>
                    {keepButtonString}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default HighlightPlanDowngradeModal;
