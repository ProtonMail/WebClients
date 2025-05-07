import { createSelector } from '@reduxjs/toolkit';

import type { MailState } from '../rootReducer';
import { DEFAULT_SUBSCRIPTION_COUNTS } from './constants';

const subscriptions = (state: MailState) => state.newsletterSubscription.value?.subscriptions;
const selectedSub = (state: MailState) => state.newsletterSubscription.value?.selectedSubscription;
const filteredSubs = (state: MailState) => state.newsletterSubscription.value?.filteredSubscriptions;
const counts = (state: MailState) => state.newsletterSubscription.value?.counts;
const loading = (state: MailState) => state.newsletterSubscription.value?.loading;

export const subscriptionListSelector = createSelector([subscriptions], (subs) => subs || []);
export const loadingSelector = createSelector([loading], (loading) => loading || false);
export const filteredSubscriptionList = createSelector([filteredSubs], (filteredSubs) => filteredSubs || []);
export const selectedSubscriptionSelector = createSelector([selectedSub], (selectedSub) => selectedSub || null);
export const subscriptionCountSelector = createSelector([counts], (counts) => counts || DEFAULT_SUBSCRIPTION_COUNTS);

export const isSubscriptionActiveSelector = (subscriptionId: string) =>
    createSelector([selectedSub], (selectedSub) => selectedSub?.ID === subscriptionId);
