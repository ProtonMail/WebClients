import { Loader } from '../../../components';
import {
    useAddresses,
    useCalendars,
    useOrganization,
    useSubscription,
    useUser,
    usePlans,
    useVPNCountriesCount,
    useVPNServersCount,
} from '../../../hooks';
import MozillaInfoPanel from '../../account/MozillaInfoPanel';
import UsagePanel from './UsagePanel';
import { useSubscriptionModal } from './SubscriptionModalProvider';
import SubscriptionPanel from './SubscriptionPanel';
import UpsellPanel from './UpsellPanel';

import './YourPlanSection.scss';

const YourPlanSection = () => {
    const [user] = useUser();
    const [plans = [], loadingPlans] = usePlans();
    const [addresses] = useAddresses();
    const [calendars] = useCalendars();
    const [subscription, loadingSubscription] = useSubscription();
    const [organization, loadingOrganization] = useOrganization();
    const [vpnCountries] = useVPNCountriesCount();
    const [vpnServers] = useVPNServersCount();
    const [openSubscriptionModal] = useSubscriptionModal();

    const loading = loadingSubscription || loadingOrganization || loadingPlans;

    if (loading) {
        return <Loader />;
    }

    const { isManagedByMozilla } = subscription;

    if (isManagedByMozilla) {
        return <MozillaInfoPanel />;
    }

    return (
        <div className="your-plan-section-container flex-gap-2">
            <SubscriptionPanel
                subscription={subscription}
                organization={organization}
                user={user}
                addresses={addresses}
                vpnCountries={vpnCountries}
                vpnServers={vpnServers}
                openSubscriptionModal={openSubscriptionModal}
            />
            <UpsellPanel
                subscription={subscription}
                plans={plans}
                user={user}
                openSubscriptionModal={openSubscriptionModal}
            />
            <UsagePanel addresses={addresses} calendars={calendars} organization={organization} user={user} />
        </div>
    );
};
export default YourPlanSection;
