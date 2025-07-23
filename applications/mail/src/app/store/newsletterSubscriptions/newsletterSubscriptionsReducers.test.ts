import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';

import { SortSubscriptionsValue, SubscriptionTabs } from './interface';
import type {
    deleteNewsletterSubscription,
    fetchNextNewsletterSubscriptionsPage,
    filterSubscriptionList,
    unsubscribeSubscription,
    updateSubscription,
} from './newsletterSubscriptionsActions';
import {
    deleteNewsletterSubscriptionPending,
    deleteNewsletterSubscriptionRejected,
    fetchNextNewsletterSubscriptionsPageFulfilled,
    filterSubscriptionListFulfilled,
    filterSubscriptionListPending,
    filterSubscriptionListRejected,
    handleServerEvent,
    removeSubscriptionFromActiveTabReducer,
    setSelectedElementIdReducer,
    setSelectedSubscriptionReducer,
    setSelectedTabReducer,
    setSortingOrderReducer,
    sortSubscriptionFulfilled,
    sortSubscriptionPending,
    sortSubscriptionRejected,
    unsubscribeSubscriptionAnimationEndedReducer,
    unsubscribeSubscriptionPending,
    unsubscribeSubscriptionRejected,
    updateSubscriptionFulfilled,
    updateSubscriptionPending,
    updateSubscriptionRejected,
} from './newsletterSubscriptionsReducers';
import type { NewsletterSubscriptionsStateType } from './newsletterSubscriptionsSlice';

const activeSubscription: NewsletterSubscription = {
    ID: 'active-1',
    UserId: 'user-1',
    AddressId: 'address-1',
    ListId: 'list-1',
    SenderAddress: 'sender-1@proton.me',
    BimiSelector: 'bimi-1',
    Name: 'Active Subscription',
    UnsubscribedTime: 0,
    FirstReceivedTime: '2021-01-01',
    LastReceivedTime: '2021-01-01',
    LastReadTime: '2021-01-01',
    ReceivedMessageCount: 10,
    UnreadMessageCount: 5,
    MarkAsRead: true,
    MoveToFolder: null,
    ReceivedMessages: {
        Total: 10,
        Last30Days: 5,
        Last90Days: 3,
    },
    UnsubscribeMethods: {
        HttpClient: '',
    },
    Unsubscribed: false,
    Spam: false,
    Hidden: false,
    DiscussionsGroup: false,
};

describe('Newsletter subscription reducers', () => {
    let state: NewsletterSubscriptionsStateType;
    let undefinedValueState: NewsletterSubscriptionsStateType;

    beforeEach(() => {
        state = {
            value: {
                byId: {},
                tabs: {
                    active: {
                        ids: [],
                        totalCount: 0,
                        loading: false,
                        sorting: SortSubscriptionsValue.MostRead,
                        paginationQueryString: null,
                    },
                    unsubscribe: {
                        ids: [],
                        totalCount: 0,
                        loading: false,
                        sorting: SortSubscriptionsValue.MostRead,
                        paginationQueryString: null,
                    },
                },
                selectedTab: SubscriptionTabs.Active,
                selectedSubscriptionId: undefined,
                selectedElementId: undefined,
                unsubscribingSubscriptionId: undefined,
            },
            error: null,
            meta: {
                fetchedAt: 0,
                fetchedEphemeral: false,
            },
        };

        undefinedValueState = {
            ...state,
            value: undefined,
        };
    });

    describe('setSelectedElementIdReducer', () => {
        it('should set the selected element id', () => {
            setSelectedElementIdReducer(state, {
                type: 'newsletterSubscriptions/setSelectedElementId',
                payload: '1',
            });

            expect(state.value?.selectedElementId).toEqual('1');
        });

        it('should return if the state is not initialized', () => {
            setSelectedElementIdReducer(undefinedValueState, {
                type: 'newsletterSubscriptions/setSelectedElementId',
                payload: '1',
            });

            expect(undefinedValueState.value).toBeUndefined();
        });
    });

    describe('setSortingOrderReducer', () => {
        it('should set the sorting order', () => {
            setSortingOrderReducer(state, {
                type: 'newsletterSubscriptions/setSortingOrder',
                payload: SortSubscriptionsValue.MostRead,
            });

            expect(state.value?.tabs.active.sorting).toEqual(SortSubscriptionsValue.MostRead);
        });

        it('should return undefined if the state is not initialized', () => {
            setSortingOrderReducer(undefinedValueState, {
                type: 'newsletterSubscriptions/setSortingOrder',
                payload: SortSubscriptionsValue.MostRead,
            });

            expect(undefinedValueState.value).toBeUndefined();
        });
    });

    describe('setSelectedTabReducer', () => {
        it('should reset the selected elements when changing tab', () => {
            state.value!.selectedElementId = '1';
            state.value!.selectedSubscriptionId = '1';

            setSelectedTabReducer(state, {
                type: 'newsletterSubscriptions/setSelectedTab',
                payload: SubscriptionTabs.Unsubscribe,
            });

            expect(state.value?.selectedElementId).toBeUndefined();
            expect(state.value?.selectedSubscriptionId).toBeUndefined();
        });

        it('should return undefined if the state is not initialized', () => {
            setSelectedTabReducer(undefinedValueState, {
                type: 'newsletterSubscriptions/setSelectedTab',
                payload: SubscriptionTabs.Unsubscribe,
            });

            expect(undefinedValueState.value).toBeUndefined();
        });
    });

    describe('setSelectedSubscriptionReducer', () => {
        it('should set the selected subscription id and reset the selected element id', () => {
            state.value!.selectedElementId = '1';
            state.value!.selectedSubscriptionId = undefined;

            setSelectedSubscriptionReducer(state, {
                type: 'newsletterSubscriptions/setSelectedSubscription',
                payload: {
                    ID: '1',
                    Name: 'Test',
                } as NewsletterSubscription,
            });

            expect(state.value?.selectedSubscriptionId).toBe('1');
            expect(state.value?.selectedElementId).toBeUndefined();
        });

        it('should return undefined if the state is not initialized', () => {
            setSelectedSubscriptionReducer(undefinedValueState, {
                type: 'newsletterSubscriptions/setSelectedSubscription',
                payload: {
                    ID: '1',
                    Name: 'Test',
                } as NewsletterSubscription,
            });

            expect(undefinedValueState.value).toBeUndefined();
        });
    });

    describe('removeSubscriptionFromActiveTabReducer', () => {
        it('should remove the subscription from the active tab', () => {
            state.value!.tabs.active.ids = ['1', '2', '3'];
            state.value!.tabs.unsubscribe.ids = [];

            removeSubscriptionFromActiveTabReducer(state, {
                type: 'newsletterSubscriptions/removeSubscriptionFromActiveTab',
                payload: '1',
            });

            expect(state.value?.tabs.active.ids).toEqual(['2', '3']);
        });

        it('should not remove the subscription if it is not in the active tab', () => {
            state.value!.tabs.active.ids = ['1', '2', '3'];
            state.value!.tabs.unsubscribe.ids = [];

            removeSubscriptionFromActiveTabReducer(state, {
                type: 'newsletterSubscriptions/removeSubscriptionFromActiveTab',
                payload: '4',
            });

            expect(state.value?.tabs.active.ids).toEqual(['1', '2', '3']);
        });

        it('should return undefined if the state is not initialized', () => {
            removeSubscriptionFromActiveTabReducer(undefinedValueState, {
                type: 'newsletterSubscriptions/removeSubscriptionFromActiveTab',
                payload: '4',
            });

            expect(undefinedValueState.value).toBeUndefined();
        });
    });

    describe('deleteSubscriptionAnimationEndedReducer', () => {
        it('should reset the deleting subscription id', () => {
            state.value!.unsubscribingSubscriptionId = '1';

            unsubscribeSubscriptionAnimationEndedReducer(state);

            expect(state.value?.unsubscribingSubscriptionId).toBeUndefined();
        });

        it('should return undefined if the state is not initialized', () => {
            unsubscribeSubscriptionAnimationEndedReducer(undefinedValueState);

            expect(undefinedValueState.value).toBeUndefined();
        });
    });

    describe('unsubscribeSubscriptionPending', () => {
        let testState: NewsletterSubscriptionsStateType;

        const meta: ReturnType<typeof unsubscribeSubscription.pending>['meta'] = {
            arg: {
                subscription: activeSubscription,
                subscriptionIndex: 0,
            },
            requestId: 'test-request-id',
            requestStatus: 'pending',
        };

        beforeEach(() => {
            testState = {
                ...state,
                value: {
                    ...state.value!,
                    byId: {
                        [activeSubscription.ID]: activeSubscription,
                    },
                    tabs: {
                        ...state.value!.tabs,
                        active: {
                            ...state.value!.tabs.active,
                            ids: [activeSubscription.ID],
                            totalCount: 1,
                        },
                    },
                },
            };
        });

        it('should move the subscription to the unsubscribe tab and update count', () => {
            unsubscribeSubscriptionPending(testState, {
                type: 'newsletterSubscriptions/unsubscribeSubscription',
                payload: undefined,
                meta,
            });

            expect(testState.value?.byId[activeSubscription.ID].UnsubscribedTime).not.toBe(0);

            expect(testState.value?.tabs.active.ids).toEqual([activeSubscription.ID]);
            expect(testState.value?.tabs.active.totalCount).toEqual(0);

            expect(testState.value?.tabs.unsubscribe.ids).toEqual([activeSubscription.ID]);
            expect(testState.value?.tabs.unsubscribe.totalCount).toEqual(1);

            expect(testState.value?.unsubscribingSubscriptionId).toEqual(activeSubscription.ID);
        });

        it('should unselect the subscription if it is the one currently selected', () => {
            testState.value!.selectedSubscriptionId = activeSubscription.ID;

            unsubscribeSubscriptionPending(testState, {
                type: 'newsletterSubscriptions/unsubscribeSubscription',
                payload: undefined,
                meta,
            });

            expect(testState.value?.byId[activeSubscription.ID].UnsubscribedTime).not.toBe(0);

            expect(testState.value?.selectedSubscriptionId).toBeUndefined();
        });

        it('should return undefined if the state is not initialized', () => {
            unsubscribeSubscriptionPending(undefinedValueState, {
                type: 'newsletterSubscriptions/unsubscribeSubscription',
                payload: undefined,
                meta,
            });

            expect(undefinedValueState.value).toBeUndefined();
        });
    });

    describe('unsubscribeSubscriptionRejected', () => {
        const meta: ReturnType<typeof unsubscribeSubscription.rejected>['meta'] = {
            arg: {
                subscription: { ...activeSubscription, UnsubscribedTime: 100 },
                subscriptionIndex: 0,
            },
            requestId: 'test-request-id',
            requestStatus: 'rejected',
            aborted: false,
            condition: false,
            rejectedWithValue: true,
        };

        beforeEach(() => {
            state.value!.byId = {
                [activeSubscription.ID]: {
                    ...activeSubscription,
                    UnsubscribedTime: 100,
                    ReceivedMessageCount: 10,
                    Name: 'New name',
                },
            };
            state.value!.tabs.unsubscribe.ids = [];
            state.value!.tabs.unsubscribe.totalCount = 0;
            state.value!.tabs.active.ids = [];
            state.value!.tabs.active.totalCount = 0;
        });

        it('should rollback the subscription to the previous state', () => {
            const previousState = activeSubscription;

            unsubscribeSubscriptionRejected(state, {
                type: 'newsletterSubscriptions/unsubscribeSubscription',
                payload: { previousState, originalIndex: 0 },
                meta,
                error: {},
            });

            expect(state.value?.byId[activeSubscription.ID].Name).toEqual(previousState.Name);
            expect(state.value?.byId[activeSubscription.ID].UnsubscribedTime).toEqual(previousState.UnsubscribedTime);
            expect(state.value?.byId[activeSubscription.ID].ReceivedMessageCount).toEqual(
                previousState.ReceivedMessageCount
            );
        });

        it('should select the previous subscription and reset the deleting subscription id if no subscription is selected', () => {
            const previousState = activeSubscription;

            unsubscribeSubscriptionRejected(state, {
                type: 'newsletterSubscriptions/unsubscribeSubscription',
                payload: { previousState, originalIndex: 0 },
                meta,
                error: {},
            });

            expect(state.value?.selectedSubscriptionId).toEqual(activeSubscription.ID);
            expect(state.value?.unsubscribingSubscriptionId).toBeUndefined();
        });

        it('should not reset the selected subscription if selected', () => {
            const previousState = activeSubscription;
            state.value!.selectedSubscriptionId = 'some-id';

            unsubscribeSubscriptionRejected(state, {
                type: 'newsletterSubscriptions/unsubscribeSubscription',
                payload: { previousState, originalIndex: 0 },
                meta,
                error: {},
            });

            expect(state.value?.selectedSubscriptionId).toEqual('some-id');
        });

        it('should reset the state of the tabs', () => {
            const previousState = { ...activeSubscription, UnsubscribedTime: 100 };

            unsubscribeSubscriptionRejected(state, {
                type: 'newsletterSubscriptions/unsubscribeSubscription',
                payload: { previousState, originalIndex: 0 },
                meta,
                error: {},
            });

            expect(state.value?.tabs.active.ids).toEqual([]);
            expect(state.value?.tabs.active.totalCount).toEqual(0);

            expect(state.value?.tabs.unsubscribe.ids).toEqual([activeSubscription.ID]);
            expect(state.value?.tabs.unsubscribe.totalCount).toEqual(1);
        });
    });

    describe('sortSubscriptionPending', () => {
        it('should set the loading state to true for both tabs', () => {
            sortSubscriptionPending(state);

            expect(state.value?.tabs.active.loading).toBeTruthy();
            expect(state.value?.tabs.unsubscribe.loading).toBeTruthy();
        });

        it('should not change the loading state if it is already true', () => {
            state.value!.tabs.active.loading = true;
            state.value!.tabs.unsubscribe.loading = true;

            sortSubscriptionPending(state);

            expect(state.value?.tabs.active.loading).toBeTruthy();
            expect(state.value?.tabs.unsubscribe.loading).toBe(true);
        });

        it('should return undefined if the state is not initialized', () => {
            sortSubscriptionPending(undefinedValueState);

            expect(undefinedValueState.value).toBeUndefined();
        });
    });

    describe('sortSubscriptionFulfilled', () => {
        const payload = {
            NewsletterSubscriptions: [
                activeSubscription,
                { ...activeSubscription, ID: 'active-2', Name: 'Active Subscription 2' },
            ],
            PageInfo: {
                Total: 2,
                NextPage: {
                    QueryString: '?page=2',
                },
            },
        };

        beforeEach(() => {
            state.value!.byId = {
                [activeSubscription.ID]: activeSubscription,
            };
            state.value!.tabs.active.ids = [activeSubscription.ID];
            state.value!.tabs.active.totalCount = 1;
            state.value!.selectedTab = SubscriptionTabs.Active;
        });

        it('should insert the new subscription in the state', () => {
            sortSubscriptionFulfilled(state, {
                type: 'newsletterSubscriptions/sortSubscription',
                payload,
            });

            expect(Object.keys(state.value!.byId)).toEqual(['active-1', 'active-2']);
            expect(state.value?.byId['active-2']).toEqual({
                ...activeSubscription,
                ID: 'active-2',
                Name: 'Active Subscription 2',
            });

            expect(state.value?.tabs.active.paginationQueryString).toEqual('?page=2');
        });

        it('should save null if there is no next page', () => {
            sortSubscriptionFulfilled(state, {
                type: 'newsletterSubscriptions/sortSubscription',
                payload: {
                    ...payload,
                    PageInfo: {
                        ...payload.PageInfo,
                        NextPage: null,
                    },
                },
            });

            expect(state.value?.tabs.active.paginationQueryString).toBeNull();
        });

        it('should reset the loading state of the tabs', () => {
            state.value!.tabs.active.loading = true;
            state.value!.tabs.unsubscribe.loading = true;

            sortSubscriptionFulfilled(state, {
                type: 'newsletterSubscriptions/sortSubscription',
                payload,
            });

            expect(state.value?.tabs.active.loading).toBeFalsy();
            expect(state.value?.tabs.unsubscribe.loading).toBeFalsy();
        });

        it('should update the tab data', () => {
            sortSubscriptionFulfilled(state, {
                type: 'newsletterSubscriptions/sortSubscription',
                payload,
            });

            expect(state.value?.tabs.active.paginationQueryString).toEqual('?page=2');
            expect(state.value?.tabs.active.ids).toEqual(['active-1', 'active-2']);
        });

        it('should return undefined if the state is not initialized', () => {
            sortSubscriptionFulfilled(undefinedValueState, {
                type: 'newsletterSubscriptions/sortSubscription',
                payload,
            });

            expect(undefinedValueState.value).toBeUndefined();
        });
    });

    describe('sortSubscriptionRejected', () => {
        it('should set the loading state to false for both tabs', () => {
            sortSubscriptionRejected(state);

            expect(state.value?.tabs.active.loading).toBeFalsy();
            expect(state.value?.tabs.unsubscribe.loading).toBeFalsy();
        });

        it('should not change the loading state if it is already false', () => {
            state.value!.tabs.active.loading = false;
            state.value!.tabs.unsubscribe.loading = false;

            sortSubscriptionRejected(state);

            expect(state.value?.tabs.active.loading).toBeFalsy();
            expect(state.value?.tabs.unsubscribe.loading).toBeFalsy();
        });

        it('should return undefined if the state is not initialized', () => {
            sortSubscriptionRejected(undefinedValueState);

            expect(undefinedValueState.value).toBeUndefined();
        });
    });

    describe('filterSubscriptionListPending', () => {
        const meta: ReturnType<typeof filterSubscriptionList.pending>['meta'] = {
            arg: {
                subscription: activeSubscription,
                subscriptionIndex: 0,
                data: {
                    ApplyTo: 'All',
                    MarkAsRead: true,
                    DestinationFolder: 'folder-1',
                },
            },
            requestId: 'test-request-id',
            requestStatus: 'pending',
        };

        it('should update the subscription with filter data', () => {
            state.value!.byId = {
                [activeSubscription.ID]: activeSubscription,
            };

            filterSubscriptionListPending(state, {
                type: 'newsletterSubscriptions/filterSubscriptionList',
                payload: undefined,
                meta,
            });

            expect(state.value?.byId[activeSubscription.ID].MarkAsRead).toEqual(true);
            expect(state.value?.byId[activeSubscription.ID].MoveToFolder).toEqual('folder-1');
        });

        it('should create a temporary filter ID when applying to future emails', () => {
            state.value!.byId = {
                [activeSubscription.ID]: activeSubscription,
            };

            filterSubscriptionListPending(state, {
                type: 'newsletterSubscriptions/filterSubscriptionList',
                payload: undefined,
                meta,
            });

            expect(state.value?.byId[activeSubscription.ID].FilterID).toEqual('temporaryFilterID');
        });

        it('should not create a temporary filter ID when applying to existing emails', () => {
            state.value!.byId = {
                [activeSubscription.ID]: activeSubscription,
            };

            filterSubscriptionListPending(state, {
                type: 'newsletterSubscriptions/filterSubscriptionList',
                payload: undefined,
                meta: {
                    ...meta,
                    arg: {
                        ...meta.arg,
                        data: {
                            ...meta.arg.data,
                            ApplyTo: 'Existing',
                        },
                    },
                },
            });

            expect(state.value?.byId[activeSubscription.ID].FilterID).toBeUndefined();
        });

        it('should return undefined if the state is not initialized', () => {
            filterSubscriptionListPending(undefinedValueState, {
                type: 'newsletterSubscriptions/filterSubscriptionList',
                payload: undefined,
                meta,
            });

            expect(undefinedValueState.value).toBeUndefined();
        });
    });

    describe('filterSubscriptionListFulfilled', () => {
        const meta: ReturnType<typeof filterSubscriptionList.fulfilled>['meta'] = {
            arg: {
                subscription: activeSubscription,
                subscriptionIndex: 0,
                data: {
                    ApplyTo: 'All',
                    MarkAsRead: true,
                    DestinationFolder: 'folder-1',
                },
            },
            requestId: 'test-request-id',
            requestStatus: 'fulfilled',
        };

        it('should update the subscription in the state', () => {
            state.value!.byId = {
                [activeSubscription.ID]: activeSubscription,
            };
            state.value!.tabs.active.ids = [activeSubscription.ID];
            state.value!.tabs.active.totalCount = 1;

            filterSubscriptionListFulfilled(state, {
                type: 'newsletterSubscriptions/filterSubscriptionList',
                payload: {
                    NewsletterSubscription: { ...activeSubscription, UnsubscribedTime: 100 },
                },
                meta,
            });

            expect(state.value?.byId[activeSubscription.ID].UnsubscribedTime).toEqual(100);
        });

        it('should create the subscription in the state if it does not exist', () => {
            const newSubscription: NewsletterSubscription = {
                ...activeSubscription,
                UnsubscribedTime: 100,
            };

            filterSubscriptionListFulfilled(state, {
                type: 'newsletterSubscriptions/filterSubscriptionList',
                payload: {
                    NewsletterSubscription: newSubscription,
                },
                meta,
            });

            expect(state.value?.byId[activeSubscription.ID]).toEqual(newSubscription);
        });

        it('should return undefined if the state is not initialized', () => {
            const newSubscription: NewsletterSubscription = {
                ...activeSubscription,
                UnsubscribedTime: 100,
            };

            filterSubscriptionListFulfilled(undefinedValueState, {
                type: 'newsletterSubscriptions/filterSubscriptionList',
                payload: {
                    NewsletterSubscription: newSubscription,
                },
                meta,
            });

            expect(undefinedValueState.value).toBeUndefined();
        });
    });

    describe('filterSubscriptionListRejected', () => {
        const meta: ReturnType<typeof filterSubscriptionList.rejected>['meta'] = {
            arg: {
                subscription: activeSubscription,
                subscriptionIndex: 0,
                data: {
                    ApplyTo: 'All',
                },
            },
            requestId: 'test-request-id',
            requestStatus: 'rejected',
            aborted: false,
            condition: false,
            rejectedWithValue: true,
        };

        it('should rollback the subscription to the previous state', () => {
            const previousState = activeSubscription;

            state.value!.byId = {
                [activeSubscription.ID]: {
                    ...activeSubscription,
                    UnsubscribedTime: 100,
                    ReceivedMessageCount: 10,
                    Name: 'New name',
                },
            };

            filterSubscriptionListRejected(state, {
                type: 'newsletterSubscriptions/filterSubscriptionList',
                payload: { previousState, originalIndex: 0 },
                meta,
                error: {},
            });

            expect(state.value?.byId[activeSubscription.ID].Name).toEqual(previousState.Name);
            expect(state.value?.byId[activeSubscription.ID].UnsubscribedTime).toEqual(previousState.UnsubscribedTime);
            expect(state.value?.byId[activeSubscription.ID].ReceivedMessageCount).toEqual(
                previousState.ReceivedMessageCount
            );
        });

        it('should return undefined if the state is not initialized', () => {
            const previousState = activeSubscription;

            filterSubscriptionListRejected(undefinedValueState, {
                type: 'newsletterSubscriptions/filterSubscriptionList',
                payload: { previousState, originalIndex: 0 },
                meta,
                error: {},
            });

            expect(undefinedValueState.value).toBeUndefined();
        });
    });
    describe('fetchNextNewsletterSubscriptionsPageFulfilled', () => {
        const payload = {
            NewsletterSubscriptions: [{ ...activeSubscription, ID: 'active-2' }],
            PageInfo: {
                Total: 1,
                NextPage: {
                    QueryString: '?page=2',
                },
            },
        };

        const meta: ReturnType<typeof fetchNextNewsletterSubscriptionsPage.fulfilled>['meta'] = {
            arg: undefined,
            requestId: 'test-request-id',
            requestStatus: 'fulfilled',
        };

        it('should update the state with the new subscriptions', () => {
            state.value!.tabs.active.ids = [activeSubscription.ID];
            state.value!.byId = {
                [activeSubscription.ID]: activeSubscription,
            };

            fetchNextNewsletterSubscriptionsPageFulfilled(state, {
                type: 'newsletterSubscriptions/fetchNextNewsletterSubscriptionsPage',
                payload,
                meta,
            });

            expect(state.value?.tabs.active.ids).toEqual([activeSubscription.ID, 'active-2']);
        });

        it('should return undefined if the state is not initialized', () => {
            fetchNextNewsletterSubscriptionsPageFulfilled(undefinedValueState, {
                type: 'newsletterSubscriptions/fetchNextNewsletterSubscriptionsPage',
                payload,
                meta,
            });

            expect(undefinedValueState.value).toBeUndefined();
        });
    });

    describe('updateSubscriptionPending', () => {
        const meta: ReturnType<typeof updateSubscription.pending>['meta'] = {
            arg: {
                subscription: activeSubscription,
                subscriptionIndex: 0,
                data: {
                    Unsubscribed: true,
                },
            },
            requestId: 'test-request-id',
            requestStatus: 'pending',
        };

        it('should update the subscription with the new data', () => {
            state.value!.byId = {
                [activeSubscription.ID]: activeSubscription,
            };
            state.value!.tabs.active.ids = [activeSubscription.ID];
            state.value!.tabs.active.totalCount = 1;

            updateSubscriptionPending(state, {
                type: 'newsletterSubscriptions/updateSubscription',
                payload: undefined,
                meta,
            });

            expect(state.value?.byId[activeSubscription.ID].UnsubscribedTime).not.toBe(0);
            expect(state.value?.tabs.active.totalCount).toEqual(0);

            expect(state.value?.tabs.unsubscribe.ids).toEqual([activeSubscription.ID]);
            expect(state.value?.tabs.unsubscribe.totalCount).toEqual(1);
            expect(state.value?.unsubscribingSubscriptionId).toEqual(activeSubscription.ID);
        });

        it('should unselect the subscription if it is the one currently selected', () => {
            state.value!.byId = {
                [activeSubscription.ID]: activeSubscription,
            };
            state.value!.selectedSubscriptionId = activeSubscription.ID;
            state.value!.tabs.active.ids = [activeSubscription.ID];
            state.value!.tabs.active.totalCount = 1;

            updateSubscriptionPending(state, {
                type: 'newsletterSubscriptions/updateSubscription',
                payload: undefined,
                meta,
            });

            expect(state.value?.byId[activeSubscription.ID].UnsubscribedTime).not.toBe(0);
            expect(state.value?.selectedSubscriptionId).toBeUndefined();
            expect(state.value?.tabs.active.totalCount).toEqual(0);

            expect(state.value?.tabs.unsubscribe.ids).toEqual([activeSubscription.ID]);
            expect(state.value?.tabs.unsubscribe.totalCount).toEqual(1);
            expect(state.value?.unsubscribingSubscriptionId).toEqual(activeSubscription.ID);
        });

        it('should return undefined if the state is not initialized', () => {
            updateSubscriptionPending(undefinedValueState, {
                type: 'newsletterSubscriptions/updateSubscription',
                payload: undefined,
                meta,
            });

            expect(undefinedValueState.value).toBeUndefined();
        });
    });

    describe('updateSubscriptionRejected', () => {
        const meta: ReturnType<typeof updateSubscription.rejected>['meta'] = {
            arg: {
                subscription: { ...activeSubscription, UnsubscribedTime: 100 },
                subscriptionIndex: 0,
                data: {
                    Unsubscribed: true,
                },
            },
            requestId: 'test-request-id',
            requestStatus: 'rejected',
            aborted: false,
            condition: false,
            rejectedWithValue: true,
        };

        beforeEach(() => {
            state.value!.byId = {
                [activeSubscription.ID]: {
                    ...activeSubscription,
                    UnsubscribedTime: 100,
                    ReceivedMessageCount: 10,
                    Name: 'New name',
                },
            };
            state.value!.tabs.unsubscribe.ids = [];
            state.value!.tabs.unsubscribe.totalCount = 0;
            state.value!.tabs.active.ids = [];
            state.value!.tabs.active.totalCount = 0;
        });

        it('should rollback the subscription to the previous state', () => {
            const previousState = activeSubscription;

            updateSubscriptionRejected(state, {
                type: 'newsletterSubscriptions/unsubscribeSubscription',
                payload: { previousState, originalIndex: 0 },
                meta,
                error: {},
            });

            expect(state.value?.byId[activeSubscription.ID].Name).toEqual(previousState.Name);
            expect(state.value?.byId[activeSubscription.ID].UnsubscribedTime).toEqual(previousState.UnsubscribedTime);
            expect(state.value?.byId[activeSubscription.ID].ReceivedMessageCount).toEqual(
                previousState.ReceivedMessageCount
            );
        });

        it('should select the previous subscription and reset the deleting subscription id if no subscription is selected', () => {
            const previousState = activeSubscription;

            updateSubscriptionRejected(state, {
                type: 'newsletterSubscriptions/unsubscribeSubscription',
                payload: { previousState, originalIndex: 0 },
                meta,
                error: {},
            });

            expect(state.value?.selectedSubscriptionId).toEqual(activeSubscription.ID);
            expect(state.value?.unsubscribingSubscriptionId).toBeUndefined();
        });

        it('should not reset the selected subscription if selected', () => {
            const previousState = activeSubscription;
            state.value!.selectedSubscriptionId = 'some-id';

            updateSubscriptionRejected(state, {
                type: 'newsletterSubscriptions/unsubscribeSubscription',
                payload: { previousState, originalIndex: 0 },
                meta,
                error: {},
            });

            expect(state.value?.selectedSubscriptionId).toEqual('some-id');
        });

        it('should reset the state of the tabs', () => {
            const previousState = { ...activeSubscription, UnsubscribedTime: 100 };

            updateSubscriptionRejected(state, {
                type: 'newsletterSubscriptions/unsubscribeSubscription',
                payload: { previousState, originalIndex: 0 },
                meta,
                error: {},
            });

            expect(state.value?.tabs.active.ids).toEqual([]);
            expect(state.value?.tabs.active.totalCount).toEqual(0);

            expect(state.value?.tabs.unsubscribe.ids).toEqual([activeSubscription.ID]);
            expect(state.value?.tabs.unsubscribe.totalCount).toEqual(1);
        });

        it('should return undefined if the state is not initialized', () => {
            const previousState = activeSubscription;

            updateSubscriptionRejected(undefinedValueState, {
                type: 'newsletterSubscriptions/unsubscribeSubscription',
                payload: { previousState, originalIndex: 0 },
                meta,
                error: {},
            });

            expect(undefinedValueState.value).toBeUndefined();
        });
    });

    describe('updateSubscriptionFulfilled', () => {
        const payload = {
            NewsletterSubscription: {
                ...activeSubscription,
                UnsubscribedTime: 100,
                ReceivedMessageCount: 10,
            },
        };

        const meta: ReturnType<typeof updateSubscription.fulfilled>['meta'] = {
            arg: {
                subscription: activeSubscription,
                subscriptionIndex: 0,
                data: {
                    Unsubscribed: true,
                },
            },
            requestId: 'test-request-id',
            requestStatus: 'fulfilled',
        };

        it('should update the subscription with the new data', () => {
            state.value!.byId = {
                [activeSubscription.ID]: activeSubscription,
            };

            updateSubscriptionFulfilled(state, {
                type: 'newsletterSubscriptions/updateSubscription',
                payload,
                meta,
            });

            expect(state.value?.byId[activeSubscription.ID].UnsubscribedTime).toEqual(100);
            expect(state.value?.byId[activeSubscription.ID].ReceivedMessageCount).toEqual(10);
        });

        it('should return undefined if the state is not initialized', () => {
            updateSubscriptionFulfilled(undefinedValueState, {
                type: 'newsletterSubscriptions/updateSubscription',
                payload,
                meta,
            });

            expect(undefinedValueState.value).toBeUndefined();
        });
    });

    describe('deleteNewsletterSubscriptionPending', () => {
        const meta: ReturnType<typeof deleteNewsletterSubscription.pending>['meta'] = {
            arg: {
                subscription: activeSubscription,
            },
            requestId: 'test-request-id',
            requestStatus: 'pending',
        };

        it('should unselect the subscription if it is the one currently selected', () => {
            state.value!.byId = {
                [activeSubscription.ID]: activeSubscription,
            };
            state.value!.tabs.active.ids = [activeSubscription.ID];
            state.value!.tabs.active.totalCount = 1;

            deleteNewsletterSubscriptionPending(state, {
                type: 'newsletterSubscriptions/deleteNewsletterSubscription',
                payload: undefined,
                meta,
            });

            expect(state.value?.selectedSubscriptionId).toBeUndefined();
            expect(state.value?.selectedElementId).toBeUndefined();
        });

        it('should remove the subscription from the store and active tab', () => {
            state.value!.byId = {
                [activeSubscription.ID]: activeSubscription,
            };
            state.value!.tabs.active.ids = [activeSubscription.ID];
            state.value!.tabs.active.totalCount = 1;

            deleteNewsletterSubscriptionPending(state, {
                type: 'newsletterSubscriptions/deleteNewsletterSubscription',
                payload: undefined,
                meta,
            });

            expect(state.value?.tabs.active.ids).toEqual([]);
            expect(state.value?.tabs.active.totalCount).toEqual(0);
            expect(state.value?.byId).toStrictEqual({});
        });

        it('should remove the subscription from the unsubscribe tab', () => {
            const unsubscribedSubscription = {
                ...activeSubscription,
                UnsubscribedTime: 100,
            };

            state.value!.byId = {
                [unsubscribedSubscription.ID]: unsubscribedSubscription,
            };
            state.value!.tabs.unsubscribe.ids = [activeSubscription.ID];
            state.value!.tabs.unsubscribe.totalCount = 1;

            deleteNewsletterSubscriptionPending(state, {
                type: 'newsletterSubscriptions/deleteNewsletterSubscription',
                payload: undefined,
                meta,
            });

            expect(state.value?.tabs.unsubscribe.ids).toEqual([]);
            expect(state.value?.tabs.unsubscribe.totalCount).toEqual(0);
            expect(state.value?.byId).toStrictEqual({});
        });

        it('should not delete the subscription if it is not in the store', () => {
            const secondActiveSubscription = {
                ...activeSubscription,
                ID: 'second-active-subscription-id',
            };

            state.value!.byId = {
                [secondActiveSubscription.ID]: secondActiveSubscription,
            };
            state.value!.tabs.active.ids = [secondActiveSubscription.ID];
            state.value!.tabs.active.totalCount = 1;

            deleteNewsletterSubscriptionPending(state, {
                type: 'newsletterSubscriptions/deleteNewsletterSubscription',
                payload: undefined,
                meta,
            });

            expect(state.value?.tabs.active.ids).toEqual([secondActiveSubscription.ID]);
            expect(state.value?.tabs.active.totalCount).toEqual(1);
            expect(state.value?.byId[activeSubscription.ID]).toBeUndefined();
        });

        it('should return undefined if the state is not initialized', () => {
            deleteNewsletterSubscriptionPending(undefinedValueState, {
                type: 'newsletterSubscriptions/deleteNewsletterSubscription',
                payload: undefined,
                meta,
            });

            expect(undefinedValueState.value).toBeUndefined();
        });
    });

    describe('deleteNewsletterSubscriptionRejected', () => {
        const meta: ReturnType<typeof deleteNewsletterSubscription.rejected>['meta'] = {
            arg: {
                subscription: { ...activeSubscription, UnsubscribedTime: 100 },
                subscriptionIndex: 0,
            },
            requestId: 'test-request-id',
            requestStatus: 'rejected',
            aborted: false,
            condition: false,
            rejectedWithValue: true,
        };

        beforeEach(() => {
            state.value!.byId = {
                [activeSubscription.ID]: {
                    ...activeSubscription,
                    UnsubscribedTime: 100,
                    ReceivedMessageCount: 10,
                    Name: 'New name',
                },
            };
            state.value!.tabs.unsubscribe.ids = [];
            state.value!.tabs.unsubscribe.totalCount = 0;

            state.value!.tabs.active.ids = [];
            state.value!.tabs.active.totalCount = 0;
        });

        it('should rollback the subscription to the previous state', () => {
            const previousState = activeSubscription;

            deleteNewsletterSubscriptionRejected(state, {
                type: 'newsletterSubscriptions/deleteNewsletterSubscription',
                payload: { previousState, originalIndex: 0 },
                meta,
                error: {},
            });

            expect(state.value?.byId[activeSubscription.ID].Name).toEqual(previousState.Name);
            expect(state.value?.byId[activeSubscription.ID].UnsubscribedTime).toEqual(previousState.UnsubscribedTime);
            expect(state.value?.byId[activeSubscription.ID].ReceivedMessageCount).toEqual(
                previousState.ReceivedMessageCount
            );
        });

        it('should rollback the subscription to the previous state', () => {
            const previousState = activeSubscription;

            deleteNewsletterSubscriptionRejected(state, {
                type: 'newsletterSubscriptions/deleteNewsletterSubscription',
                payload: { previousState, originalIndex: 0 },
                meta,
                error: {},
            });

            expect(state.value?.byId[activeSubscription.ID].Name).toEqual(previousState.Name);
            expect(state.value?.byId[activeSubscription.ID].UnsubscribedTime).toEqual(previousState.UnsubscribedTime);
            expect(state.value?.byId[activeSubscription.ID].ReceivedMessageCount).toEqual(
                previousState.ReceivedMessageCount
            );
        });

        it('should select the previous subscription and reset the deleting subscription id if no subscription is selected', () => {
            const previousState = activeSubscription;

            deleteNewsletterSubscriptionRejected(state, {
                type: 'newsletterSubscriptions/deleteNewsletterSubscription',
                payload: { previousState, originalIndex: 0 },
                meta,
                error: {},
            });

            expect(state.value?.selectedSubscriptionId).toEqual(activeSubscription.ID);
            expect(state.value?.unsubscribingSubscriptionId).toBeUndefined();
        });

        it('should not reset the selected subscription if selected', () => {
            const previousState = activeSubscription;
            state.value!.selectedSubscriptionId = 'some-id';

            deleteNewsletterSubscriptionRejected(state, {
                type: 'newsletterSubscriptions/deleteNewsletterSubscription',
                payload: { previousState, originalIndex: 0 },
                meta,
                error: {},
            });

            expect(state.value?.selectedSubscriptionId).toEqual('some-id');
        });

        it('should reset the state of the tabs', () => {
            const previousState = { ...activeSubscription, UnsubscribedTime: 100 };

            deleteNewsletterSubscriptionRejected(state, {
                type: 'newsletterSubscriptions/deleteNewsletterSubscription',
                payload: { previousState, originalIndex: 0 },
                meta,
                error: {},
            });

            expect(state.value?.tabs.active.ids).toEqual([]);
            expect(state.value?.tabs.active.totalCount).toEqual(0);

            expect(state.value?.tabs.unsubscribe.ids).toEqual([activeSubscription.ID]);
            expect(state.value?.tabs.unsubscribe.totalCount).toEqual(1);
        });
    });

    describe('handleServerEvent', () => {
        it('should treat the create event before the update event', () => {
            const subscriptionId = 'new-subscription-id';
            const newSubscription = {
                ID: subscriptionId,
                Name: 'New Newsletter',
                UnsubscribedTime: 0,
                ReceivedMessages: {
                    Last90Days: 5,
                    Last30Days: 5,
                    Total: 5,
                },
            } as NewsletterSubscription;

            // Initially the subscription doesn't exist in the store
            state.value!.byId = {};
            state.value!.tabs.active.ids = [];
            state.value!.tabs.active.totalCount = 0;

            handleServerEvent(state, {
                type: 'server event',
                payload: {
                    NewsletterSubscriptions: [
                        {
                            Action: EVENT_ACTIONS.CREATE,
                            NewsletterSubscription: newSubscription,
                            ID: subscriptionId,
                        },
                        {
                            Action: EVENT_ACTIONS.UPDATE,
                            NewsletterSubscription: {
                                ID: subscriptionId,
                                Name: 'Updated Newsletter Name',
                                ReceivedMessages: {
                                    Last30Days: 10,
                                    Last90Days: 10,
                                    Total: 10,
                                },
                            },
                            ID: subscriptionId,
                        },
                    ],
                    More: 0,
                    EventID: 'test-event-id',
                },
            });

            // Verify the subscription was created and then updated
            expect(state.value?.byId[subscriptionId]).toBeDefined();
            expect(state.value?.byId[subscriptionId].Name).toEqual('Updated Newsletter Name');
            expect(state.value?.byId[subscriptionId].ReceivedMessages?.Last90Days).toEqual(10);
            expect(state.value?.tabs.active.ids).toContain(subscriptionId);
            expect(state.value?.tabs.active.totalCount).toBe(1);
        });

        describe('Update event', () => {
            it('should update the subscription in the store', () => {
                state.value!.byId = {
                    [activeSubscription.ID]: {
                        ...activeSubscription,
                    },
                };

                handleServerEvent(state, {
                    type: 'server event',
                    payload: {
                        NewsletterSubscriptions: [
                            {
                                Action: EVENT_ACTIONS.UPDATE,
                                NewsletterSubscription: {
                                    ...activeSubscription,
                                    ReceivedMessageCount: 12,
                                },
                                ID: activeSubscription.ID,
                            },
                        ],
                        More: 0,
                        EventID: 'test-event-id',
                    },
                });

                expect(state.value?.byId[activeSubscription.ID].ReceivedMessageCount).toEqual(12);
            });

            it('should move the subscription to the top of the list if the selected tab is sorted by recently received', () => {
                state.value!.tabs.active.sorting = SortSubscriptionsValue.RecentlyReceived;
                state.value!.tabs.active.ids = ['some-ID-1', 'some-ID-2', activeSubscription.ID];
                state.value!.tabs.active.totalCount = 1;
                state.value!.byId = {
                    [activeSubscription.ID]: {
                        ...activeSubscription,
                    },
                };

                handleServerEvent(state, {
                    type: 'server event',
                    payload: {
                        NewsletterSubscriptions: [
                            {
                                Action: EVENT_ACTIONS.UPDATE,
                                NewsletterSubscription: {
                                    ...activeSubscription,
                                    ReceivedMessages: {
                                        Last90Days: 12,
                                        Last30Days: 12,
                                        Total: 12,
                                    },
                                },
                                ID: activeSubscription.ID,
                            },
                        ],
                        More: 0,
                        EventID: 'test-event-id',
                    },
                });

                expect(state.value?.tabs.active.ids).toEqual([activeSubscription.ID, 'some-ID-1', 'some-ID-2']);
            });

            it('should not move the subscription to the top of the list if the selected tab is sorted by most read', () => {
                state.value!.tabs.active.sorting = SortSubscriptionsValue.MostRead;
                state.value!.tabs.active.ids = ['some-ID-1', 'some-ID-2', activeSubscription.ID];
                state.value!.tabs.active.totalCount = 1;
                state.value!.byId = {
                    [activeSubscription.ID]: {
                        ...activeSubscription,
                    },
                };

                handleServerEvent(state, {
                    type: 'server event',
                    payload: {
                        NewsletterSubscriptions: [
                            {
                                Action: EVENT_ACTIONS.UPDATE,
                                NewsletterSubscription: {
                                    ...activeSubscription,
                                    ReceivedMessages: {
                                        Last90Days: 12,
                                        Last30Days: 12,
                                        Total: 12,
                                    },
                                },
                                ID: activeSubscription.ID,
                            },
                        ],
                        More: 0,
                        EventID: 'test-event-id',
                    },
                });

                expect(state.value?.tabs.active.ids).toEqual(['some-ID-1', 'some-ID-2', activeSubscription.ID]);
            });

            it('should move the subscription to the unsubscribe tab if it is unsubscribed', () => {
                state.value!.tabs.active.ids = [activeSubscription.ID];
                state.value!.tabs.unsubscribe.ids = ['some-ID-1', 'some-ID-2'];
                state.value!.tabs.active.totalCount = 1;
                state.value!.byId = {
                    [activeSubscription.ID]: {
                        ...activeSubscription,
                    },
                };

                handleServerEvent(state, {
                    type: 'server event',
                    payload: {
                        NewsletterSubscriptions: [
                            {
                                Action: EVENT_ACTIONS.UPDATE,
                                NewsletterSubscription: {
                                    ...activeSubscription,
                                    UnsubscribedTime: 100,
                                },
                                ID: activeSubscription.ID,
                            },
                        ],
                        More: 0,
                        EventID: 'test-event-id',
                    },
                });

                expect(state.value?.tabs.active.ids).toEqual([]);
                expect(state.value?.tabs.active.totalCount).toEqual(0);

                expect(state.value?.tabs.unsubscribe.ids).toEqual([activeSubscription.ID, 'some-ID-1', 'some-ID-2']);
                expect(state.value?.tabs.unsubscribe.totalCount).toEqual(1);
            });
        });

        describe('Create event', () => {
            it('should add the subscription to the top of the active tab if it is active', () => {
                state.value!.tabs.active.ids = ['some-ID-1', 'some-ID-2'];
                state.value!.tabs.active.totalCount = 2;

                handleServerEvent(state, {
                    type: 'server event',
                    payload: {
                        NewsletterSubscriptions: [
                            {
                                Action: EVENT_ACTIONS.CREATE,
                                NewsletterSubscription: {
                                    ...activeSubscription,
                                    Name: 'New name',
                                },
                                ID: activeSubscription.ID,
                            },
                        ],
                        More: 0,
                        EventID: 'test-event-id',
                    },
                });

                expect(state.value?.tabs.active.ids).toEqual([activeSubscription.ID, 'some-ID-1', 'some-ID-2']);
                expect(state.value?.tabs.active.totalCount).toEqual(3);
                expect(state.value?.byId[activeSubscription.ID].Name).toEqual('New name');
            });
            it('should add the subscription to the top of the unsubscribe tab if it is unsubscribe', () => {
                state.value!.tabs.unsubscribe.ids = ['some-ID-1', 'some-ID-2'];
                state.value!.tabs.unsubscribe.totalCount = 2;

                handleServerEvent(state, {
                    type: 'server event',
                    payload: {
                        NewsletterSubscriptions: [
                            {
                                Action: EVENT_ACTIONS.CREATE,
                                NewsletterSubscription: {
                                    ...activeSubscription,
                                    UnsubscribedTime: 100,
                                },
                                ID: activeSubscription.ID,
                            },
                        ],
                        More: 0,
                        EventID: 'test-event-id',
                    },
                });

                expect(state.value?.tabs.unsubscribe.ids).toEqual([activeSubscription.ID, 'some-ID-1', 'some-ID-2']);
                expect(state.value?.tabs.unsubscribe.totalCount).toEqual(3);
                expect(state.value?.byId[activeSubscription.ID].UnsubscribedTime).toEqual(100);
            });

            it('should not create hidden, spam and discussions group subscriptions', () => {
                const spamSubscriptionId = 'spam-subscription-id';
                const hiddenSubscriptionId = 'hidden-subscription-id';
                const discussionsGroupId = 'discussions-group-subscription-id';

                // Initially the subscription doesn't exist in the store
                state.value!.byId = {};
                state.value!.tabs.active.ids = [];
                state.value!.tabs.active.totalCount = 0;

                handleServerEvent(state, {
                    type: 'server event',
                    payload: {
                        NewsletterSubscriptions: [
                            {
                                Action: EVENT_ACTIONS.CREATE,
                                NewsletterSubscription: {
                                    Hidden: true,
                                    ID: hiddenSubscriptionId,
                                } as NewsletterSubscription,
                                ID: hiddenSubscriptionId,
                            },
                            {
                                Action: EVENT_ACTIONS.CREATE,
                                NewsletterSubscription: {
                                    Spam: true,
                                    ID: spamSubscriptionId,
                                } as NewsletterSubscription,
                                ID: spamSubscriptionId,
                            },
                            {
                                Action: EVENT_ACTIONS.CREATE,
                                NewsletterSubscription: {
                                    DiscussionsGroup: true,
                                    ID: discussionsGroupId,
                                } as NewsletterSubscription,
                                ID: discussionsGroupId,
                            },
                        ],
                        More: 0,
                        EventID: 'test-event-id',
                    },
                });

                // Verify the subscription was not created
                expect(state.value?.byId[hiddenSubscriptionId]).toBeUndefined();
                expect(state.value?.byId[spamSubscriptionId]).toBeUndefined();
                expect(state.value?.byId[discussionsGroupId]).toBeUndefined();
                expect(state.value?.tabs.active.ids).toEqual([]);
                expect(state.value?.tabs.active.totalCount).toBe(0);
            });
        });

        describe('Delete event', () => {
            it('should remove the subscription from the active tab if it is active', () => {
                state.value!.tabs.active.ids = [activeSubscription.ID];
                state.value!.tabs.active.totalCount = 1;
                state.value!.byId = {
                    [activeSubscription.ID]: {
                        ...activeSubscription,
                    },
                };

                handleServerEvent(state, {
                    type: 'server event',
                    payload: {
                        NewsletterSubscriptions: [
                            {
                                Action: EVENT_ACTIONS.DELETE,
                                ID: activeSubscription.ID,
                            },
                        ],
                        More: 0,
                        EventID: 'test-event-id',
                    },
                });

                expect(state.value?.tabs.active.ids).toEqual([]);
                expect(state.value?.tabs.active.totalCount).toEqual(0);
                expect(state.value?.byId[activeSubscription.ID]).toBeUndefined();
            });

            it('should remove the subscription from the unsubscribe tab if it is unsubscribe', () => {
                state.value!.tabs.unsubscribe.ids = [activeSubscription.ID];
                state.value!.tabs.unsubscribe.totalCount = 1;
                state.value!.byId = {
                    [activeSubscription.ID]: {
                        ...activeSubscription,
                        UnsubscribedTime: 100,
                    },
                };

                handleServerEvent(state, {
                    type: 'server event',
                    payload: {
                        NewsletterSubscriptions: [
                            {
                                Action: EVENT_ACTIONS.DELETE,
                                ID: activeSubscription.ID,
                            },
                        ],
                        More: 0,
                        EventID: 'test-event-id',
                    },
                });

                expect(state.value?.tabs.unsubscribe.ids).toEqual([]);
                expect(state.value?.tabs.unsubscribe.totalCount).toEqual(0);
                expect(state.value?.byId[activeSubscription.ID]).toBeUndefined();
            });

            it('should not delete the subscription if it is not in the store', () => {
                const secondActiveSubscription = {
                    ...activeSubscription,
                    ID: 'second-active-subscription-id',
                };

                state.value!.byId = {
                    [secondActiveSubscription.ID]: secondActiveSubscription,
                };
                state.value!.tabs.active.ids = [secondActiveSubscription.ID];
                state.value!.tabs.active.totalCount = 1;

                handleServerEvent(state, {
                    type: 'server event',
                    payload: {
                        NewsletterSubscriptions: [
                            {
                                Action: EVENT_ACTIONS.DELETE,
                                ID: activeSubscription.ID,
                            },
                        ],
                        More: 0,
                        EventID: 'test-event-id',
                    },
                });

                expect(state.value?.tabs.active.ids).toEqual([secondActiveSubscription.ID]);
                expect(state.value?.tabs.active.totalCount).toEqual(1);
                expect(state.value?.byId[activeSubscription.ID]).toBeUndefined();
            });
        });

        it('should return undefined if the state is not initialized', () => {
            handleServerEvent(undefinedValueState, {
                type: 'server event',
                payload: {
                    NewsletterSubscriptions: [],
                    More: 0,
                    EventID: 'test-event-id',
                },
            });

            expect(undefinedValueState.value).toBeUndefined();
        });
    });
});
