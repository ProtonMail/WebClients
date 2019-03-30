import { SubscriptionModel } from 'proton-shared/lib/models/subscriptionModel';
import createUseModelHook from './helpers/createModelHook';

export const useSubscription = createUseModelHook(SubscriptionModel);
