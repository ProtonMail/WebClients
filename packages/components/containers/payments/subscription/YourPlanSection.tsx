import { APP_NAMES } from '@proton/shared/lib/constants';

import { Loader } from '../../../components';
import {
    useAddresses,
    useCalendars,
    useFeature,
    useLoad,
    useOrganization,
    usePlans,
    useSubscription,
    useUser,
    useVPNServersCount,
} from '../../../hooks';
import { SettingsSectionWide } from '../../account';
import MozillaInfoPanel from '../../account/MozillaInfoPanel';
import { FeatureCode } from '../../features';
import PendingInvitationPanel from './PendingInvitationsPanel';
import { useSubscriptionModal } from './SubscriptionModalProvider';
import SubscriptionPanel from './SubscriptionPanel';
import UpsellPanel from './UpsellPanel';
import UsagePanel from './UsagePanel';
import { getCurrency } from './helpers';

import './YourPlanSection.scss';

interface Props {
    app: APP_NAMES;
}

const YourPlanSection = ({ app }: Props) => {
    const [user] = useUser();
    const [plans = [], loadingPlans] = usePlans();
    const [addresses] = useAddresses();
    const [calendars] = useCalendars();
    const [subscription, loadingSubscription] = useSubscription();
    const [organization, loadingOrganization] = useOrganization();
    const [vpnServers] = useVPNServersCount();
    const [openSubscriptionModal] = useSubscriptionModal();

    useLoad();

    const passPlusPlanFeature = useFeature<boolean>(FeatureCode.PassPlusPlan);
    const isPassPlusEnabled = passPlusPlanFeature.feature?.Value === true;

    const loading = loadingSubscription || loadingOrganization || loadingPlans;

    if (loading || passPlusPlanFeature.loading) {
        return <Loader />;
    }

    const { isManagedByMozilla } = subscription;

    if (isManagedByMozilla) {
        return <MozillaInfoPanel />;
    }

    const currency = getCurrency(user, subscription, plans);

    return (
        <SettingsSectionWide>
            <div className="your-plan-section-container gap-8">
                <SubscriptionPanel
                    isPassPlusEnabled={isPassPlusEnabled}
                    app={app}
                    currency={currency}
                    subscription={subscription}
                    organization={organization}
                    user={user}
                    addresses={addresses}
                    vpnServers={vpnServers}
                    openSubscriptionModal={openSubscriptionModal}
                />
                <PendingInvitationPanel />
                <UpsellPanel
                    isPassPlusEnabled={isPassPlusEnabled}
                    app={app}
                    currency={currency}
                    subscription={subscription}
                    plans={plans}
                    user={user}
                    openSubscriptionModal={openSubscriptionModal}
                />
                <UsagePanel addresses={addresses} calendars={calendars} organization={organization} user={user} />
            </div>
        </SettingsSectionWide>
    );
};
export default YourPlanSection;
