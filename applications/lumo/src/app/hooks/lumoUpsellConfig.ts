// TODO: use when handling paid user upsells in app
// import type { OpenCallbackProps } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
// import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
// import type { ADDON_NAMES, PlanIDs, SelectedPlan } from '@proton/payments';
// import { CYCLE, PLANS } from '@proton/payments';
// import type { UserModel } from '@proton/shared/lib/interfaces';
// import { getLumoAddonNameByPlan } from '@proton/payments/core/subscription/helpers';

// const getUpgradeCycles = (currentCycle = CYCLE.MONTHLY) => ({
//     cycle: currentCycle,
//     minimumCycle: currentCycle,
//     maximumCycle: currentCycle === CYCLE.MONTHLY ? CYCLE.YEARLY : currentCycle,
// });

// const paidSingleUserUpsellConfig = (
//     upsellRef: string,
//     planName: PLANS,
//     addonName: ADDON_NAMES | undefined,
//     cycle?: CYCLE
// ): OpenCallbackProps => {
//     const cycles = getUpgradeCycles(cycle);

//     const planIDs: PlanIDs = {
//         [planName]: 1,
//     };

//     if (addonName) {
//         planIDs[addonName] = 1;
//     }

//     return {
//         mode: 'upsell-modal',
//         planIDs,
//         step: SUBSCRIPTION_STEPS.CHECKOUT,
//         disablePlanSelection: true,
//         upsellRef,
//         ...cycles,
//         metrics: {
//             source: 'upsells',
//         },
//     };
// };

// const freeUserUpsellConfig = (
//     upsellRef: string,
//     onSubscribed?: () => void
// ): OpenCallbackProps => {

//     return {
//         step: SUBSCRIPTION_STEPS.CHECKOUT,
//         disablePlanSelection: true,
//         maximumCycle: CYCLE.YEARLY,
//         upsellRef,
//         plan: PLANS.LUMO,
//         onSubscribed,
//         metrics: {
//             source: 'upsells',
//         },
//     }
// }

// export const getLumoUpsellConfig = (
//     upsellRef: string,
//     user: UserModel,
//     isOrgAdmin: boolean,
//     selectedPlan: SelectedPlan,
//     onSubscribed?: () => void
// ): OpenCallbackProps | undefined => {
//     console.log('user', user);
//     if (!user.isSelf) {
//         return undefined;
//     }

//     // if (isOrgAdmin) {
//     //     const addonName = getScribeAddonNameByPlan(selectedPlan.name);
//     //     return paidMultipleUserUpsellConfig(upsellRef, addonName, selectedPlan);
//     // }

//     if(user.isFree){
//         return freeUserUpsellConfig(upsellRef, onSubscribed)
//     }

//     if (user.isPaid) {
//         const addonName = getLumoAddonNameByPlan(selectedPlan.name);
//         return paidSingleUserUpsellConfig(upsellRef, selectedPlan.name, addonName, selectedPlan.cycle);
//     }

//     return undefined;
// };
