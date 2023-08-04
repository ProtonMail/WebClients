import { APP_NAMES } from '@proton/shared/lib/constants';
import { pick } from '@proton/shared/lib/helpers/object';

import { Loader } from '../../../components';
import { useLoad, usePlans, useSubscription, useUser } from '../../../hooks';
import { SettingsSectionWide } from '../../account';
import { useSubscriptionModal } from './SubscriptionModalProvider';
import { getCurrency, resolveUpsellsToDisplay } from './helpers';
import { UpsellPanels } from './panels';

import './YourPlanSection.scss';

interface Props {
    app: APP_NAMES;
}

const UpgradeVpnSection = ({ app }: Props) => {
    const [user] = useUser();
    const [plans = [], loadingPlans] = usePlans();
    const [subscription, loadingSubscription] = useSubscription();
    const [openSubscriptionModal] = useSubscriptionModal();

    useLoad();

    const loading = loadingSubscription || loadingPlans;

    if (loading) {
        return <Loader />;
    }

    const currency = getCurrency(user, subscription, plans);
    const upsells = resolveUpsellsToDisplay({
        app,
        currency,
        subscription,
        plans,
        openSubscriptionModal,
        ...pick(user, ['canPay', 'isFree', 'hasPaidMail']),
    });

    return (
        <SettingsSectionWide>
            <div className="grid-column-2 your-plan-section-container gap-8 pt-4" data-testid="vpn-upsell-panels">
                <UpsellPanels upsells={upsells} subscription={subscription} />
            </div>
        </SettingsSectionWide>
    );
};

export default UpgradeVpnSection;
