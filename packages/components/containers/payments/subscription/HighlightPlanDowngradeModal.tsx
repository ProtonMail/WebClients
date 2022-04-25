import { c, msgid } from 'ttag';
import { getDifferenceInDays } from '@proton/shared/lib/date/date';
import { BRAND_NAME, PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';
import { Plan, UserModel } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { toMap } from '@proton/shared/lib/helpers/object';
import { getIsLegacyPlan } from '@proton/shared/lib/helpers/subscription';
import {
    Alert,
    Button,
    Loader,
    ModalProps,
    ModalTwo as Modal,
    ModalTwoHeader as ModalHeader,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    Form,
} from '../../../components';
import { useConfig, useSubscription, useVPNCountriesCount, useVPNServersCount } from '../../../hooks';

import { formatPlans } from './helpers';
import SubscriptionCancelPlan from './SubscriptionCancelPlan';
import { getShortPlan } from '../features/plan';

interface Props extends Omit<ModalProps, 'onSubmit'> {
    onConfirm: () => void;
    plans: Plan[] | undefined;
    user: UserModel;
}

const HighlightPlanDowngradeModal = ({ onConfirm, onClose, plans, user, ...rest }: Props) => {
    const { APP_NAME } = useConfig();

    const [subscription, loadingSubscription] = useSubscription();
    const { Plans = [], PeriodEnd } = subscription;
    const { mailPlan, vpnPlan } = formatPlans(Plans);

    const isVpnApp = APP_NAME === 'proton-vpn-settings';

    const getIsVpnPlan = () => {
        if (vpnPlan !== undefined && mailPlan === undefined) {
            return true;
        }

        if (mailPlan !== undefined && vpnPlan === undefined) {
            return false;
        }

        return isVpnApp;
    };

    const isVpnPlan = getIsVpnPlan();

    const currentPlan = isVpnPlan ? (vpnPlan as Plan) : (mailPlan as Plan);
    const [vpnCountries] = useVPNCountriesCount();
    const [vpnServers] = useVPNServersCount();
    const plansMap = toMap(plans, 'Name');

    const downgradedPlanNameKey = PLANS.FREE;
    const downgradedPlanName = [BRAND_NAME, PLAN_NAMES[downgradedPlanNameKey]].filter(isTruthy).join(' ');
    const downgradedPlanFeatures = getShortPlan(downgradedPlanNameKey, plansMap, vpnCountries, vpnServers);
    const planFeatures = getShortPlan(currentPlan.Name as PLANS, plansMap, vpnCountries, vpnServers);

    const daysRemaining = getDifferenceInDays(new Date(), new Date(PeriodEnd * 1000));

    const currentPlanName = [getIsLegacyPlan(currentPlan.Name) ? BRAND_NAME : '', PLAN_NAMES[currentPlan.Name as PLANS]]
        .filter(isTruthy)
        .join(' ');

    // translator: daysRemaining contains the number of days remaining for the current subscription eg 288 days remaining
    const planTimeRemainingString = c('new_plans: Plan time remaining').ngettext(
        msgid`You still have ${daysRemaining} day left on your ${currentPlanName} account.`,
        `You still have ${daysRemaining} days left on your ${currentPlanName} account.`,
        daysRemaining
    );

    // translator: will be something like "Downgrade to Proton Free" (where "Free" is the plan name)
    const downgradeButtonString = c('new_plans: Action').t`Downgrade to ${downgradedPlanName}`;

    // translator: will be something like "Keep my Proton Plus account"
    const keepButtonString = c('new_plans: Action').t`Keep my ${currentPlanName} account`;

    return (
        <Modal as={Form} onClose={onClose} size="large" {...rest}>
            <ModalHeader title={c('Title').t`Downgrade account`} />
            <ModalContent>
                {loadingSubscription ? (
                    <Loader />
                ) : (
                    <>
                        {daysRemaining > 0 && (
                            <Alert className="mb1" type="warning">
                                {planTimeRemainingString}
                                <br />
                                {c('Info')
                                    .t`By downgrading you will lose the following benefits. Are you sure you want to proceed?`}
                            </Alert>
                        )}
                        <div className="flex flex-row flex-nowrap on-mobile-flex-column">
                            <SubscriptionCancelPlan
                                name={downgradedPlanName}
                                info={downgradedPlanFeatures?.description || ''}
                                features={planFeatures?.features || []}
                                downgrade
                            />
                            <SubscriptionCancelPlan
                                name={currentPlanName}
                                info={planFeatures?.description || ''}
                                features={planFeatures?.features || []}
                            />
                        </div>
                    </>
                )}
            </ModalContent>
            <ModalFooter>
                <Button
                    disabled={loadingSubscription}
                    className="on-mobile-w100 on-mobile-mb1"
                    onClick={() => {
                        onConfirm();
                        onClose?.();
                    }}
                >
                    {downgradeButtonString}
                </Button>
                <Button className="on-mobile-w100" disabled={loadingSubscription} color="norm" onClick={onClose}>
                    {keepButtonString}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default HighlightPlanDowngradeModal;
