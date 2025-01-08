import { FeatureCode } from '@proton/features';

import type { OfferConfig } from '../../interface';
import Layout from './Layout';

export const subscriptionReminderConfig = {
    ID: 'subscription-reminder',
    autoPopUp: 'one-time',
    featureCode: FeatureCode.OfferSubscriptionReminder,
    deals: [],
    layout: Layout,
} satisfies OfferConfig;
