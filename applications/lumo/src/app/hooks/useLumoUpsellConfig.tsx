// TODO: use when handling paid user upsells in app

// import { useSubscription } from '@proton/account/subscription/hooks';
// import { useUser } from '@proton/account/user/hooks';
// import { type Plan, SelectedPlan } from '@proton/payments';

// import { getLumoUpsellConfig } from './lumoUpsellConfig';

// interface Props {
//     upsellRef: string;
//     plans: Plan[];
// }

// const useLumoUpsellConfig = ({ upsellRef, plans }: Props) => {
//     const [user] = useUser();
//     const [subscription] = useSubscription();
//     const latestSubscription = subscription?.UpcomingSubscription ?? subscription;
//     const isOrgAdmin = user.isAdmin;

//     const selectedPlan = SelectedPlan.createFromSubscription(latestSubscription, plans);

//     const lumoUpsellConfig = getLumoUpsellConfig(upsellRef, user, isOrgAdmin, selectedPlan);

//     return {
//         lumoUpsellConfig,
//     };
// };

// export default useLumoUpsellConfig;
