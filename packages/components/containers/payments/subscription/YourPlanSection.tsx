import { Loader } from '../../../components';
import {
    useAddresses,
    useOrganization,
    useSubscription,
    useUser,
    usePlans,
    useVPNCountriesCount,
} from '../../../hooks';
import MozillaInfoPanel from '../../account/MozillaInfoPanel';
import MemberPanel from './MemberPanel';
import { useSubscriptionModal } from './SubscriptionModalProvider';
import SubscriptionPanel from './SubscriptionPanel';
import UpsellPanel from './UpsellPanel';

import './YourPlanSection.scss';

const YourPlanSection = () => {
    const [user] = useUser();
    const [plans = [], loadingPlans] = usePlans();
    const [addresses, loadingAddresses] = useAddresses();
    const [subscription, loadingSubscription] = useSubscription();
    const [organization, loadingOrganization] = useOrganization();
    const [vpnCountries, loadingVpnCountries] = useVPNCountriesCount();
    const [openSubscriptionModal] = useSubscriptionModal();
    const loading =
        loadingSubscription || loadingOrganization || loadingAddresses || loadingPlans || loadingVpnCountries;

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
                openSubscriptionModal={openSubscriptionModal}
            />
            <UpsellPanel
                subscription={subscription}
                plans={plans}
                user={user}
                vpnCountries={vpnCountries}
                openSubscriptionModal={openSubscriptionModal}
            />
            <MemberPanel organization={organization} user={user} />
        </div>
    );
};
export default YourPlanSection;
