import { APP_NAMES } from '@proton/shared/lib/constants';
import { FeatureCode } from '@proton/components/containers';
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
    useFeature,
} from '../../../hooks';
import MozillaInfoPanel from '../../account/MozillaInfoPanel';
import UsagePanel from './UsagePanel';
import { useSubscriptionModal } from './SubscriptionModalProvider';
import SubscriptionPanel from './SubscriptionPanel';
import UpsellPanel from './UpsellPanel';

import './YourPlanSection.scss';
import { getCurrency } from './helpers';

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
    const [vpnCountries] = useVPNCountriesCount();
    const [vpnServers] = useVPNServersCount();
    const [openSubscriptionModal] = useSubscriptionModal();

    const drivePlanFeature = useFeature(FeatureCode.DrivePlan);
    const drivePlanEnabled = drivePlanFeature.feature?.Value === true;

    const loading = loadingSubscription || loadingOrganization || loadingPlans;

    if (loading) {
        return <Loader />;
    }

    const { isManagedByMozilla } = subscription;

    if (isManagedByMozilla) {
        return <MozillaInfoPanel />;
    }

    const currency = getCurrency(user, subscription, plans);

    return (
        <div className="your-plan-section-container flex-gap-2">
            <SubscriptionPanel
                drivePlanEnabled={drivePlanEnabled}
                app={app}
                currency={currency}
                subscription={subscription}
                organization={organization}
                user={user}
                addresses={addresses}
                vpnCountries={vpnCountries}
                vpnServers={vpnServers}
                openSubscriptionModal={openSubscriptionModal}
            />
            <UpsellPanel
                drivePlanEnabled={drivePlanEnabled}
                app={app}
                currency={currency}
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
