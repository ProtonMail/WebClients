import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';

import { SortSubscriptionsValue, SubscriptionTabs } from './interface';
import type { unsubscribeSubscription, updateSubscription } from './newsletterSubscriptionsActions';
import {
    deleteSubscriptionAnimationEndedReducer,
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
};

describe('Newsletter subscription reducers', () => {
    let state: NewsletterSubscriptionsStateType;

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
                deletingSubscriptionId: undefined,
            },
            error: null,
            meta: {
                fetchedAt: 0,
                fetchedEphemeral: false,
            },
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
    });

    describe('setSortingOrderReducer', () => {
        it('should set the sorting order', () => {
            setSortingOrderReducer(state, {
                type: 'newsletterSubscriptions/setSortingOrder',
                payload: SortSubscriptionsValue.MostRead,
            });

            expect(state.value?.tabs.active.sorting).toEqual(SortSubscriptionsValue.MostRead);
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
    });

    describe('deleteSubscriptionAnimationEndedReducer', () => {
        it('should reset the deleting subscription id', () => {
            state.value!.deletingSubscriptionId = '1';

            deleteSubscriptionAnimationEndedReducer(state);

            expect(state.value?.deletingSubscriptionId).toBeUndefined();
        });
    });

    describe('unsubscribeSubscriptionPending', () => {
        let testState: NewsletterSubscriptionsStateType;

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
                meta: {
                    arg: {
                        subscription: activeSubscription,
                        subscriptionIndex: 0,
                    },
                    requestId: 'test-request-id',
                    requestStatus: 'pending',
                },
            });

            expect(testState.value?.byId[activeSubscription.ID].UnsubscribedTime).not.toBe(0);

            expect(testState.value?.tabs.active.ids).toEqual([activeSubscription.ID]);
            expect(testState.value?.tabs.active.totalCount).toEqual(0);

            expect(testState.value?.tabs.unsubscribe.ids).toEqual([activeSubscription.ID]);
            expect(testState.value?.tabs.unsubscribe.totalCount).toEqual(1);

            expect(testState.value?.deletingSubscriptionId).toEqual(activeSubscription.ID);
        });

        it('should unselect the subscription if it is the one currently selected', () => {
            testState.value!.selectedSubscriptionId = activeSubscription.ID;

            unsubscribeSubscriptionPending(testState, {
                type: 'newsletterSubscriptions/unsubscribeSubscription',
                payload: undefined,
                meta: {
                    arg: {
                        subscription: activeSubscription,
                        subscriptionIndex: 0,
                    },
                    requestId: 'test-request-id',
                    requestStatus: 'pending',
                },
            });

            expect(testState.value?.byId[activeSubscription.ID].UnsubscribedTime).not.toBe(0);

            expect(testState.value?.selectedSubscriptionId).toBeUndefined();
        });
    });

    describe('unsubscribeSubscriptionRejected', () => {
        const meta: ReturnType<typeof unsubscribeSubscription.rejected>['meta'] = {
            arg: {
                subscription: activeSubscription,
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
            state.value!.tabs.unsubscribe.ids = [activeSubscription.ID];
            state.value!.tabs.unsubscribe.totalCount = 1;
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
            expect(state.value?.deletingSubscriptionId).toBeUndefined();
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
            const previousState = activeSubscription;

            unsubscribeSubscriptionRejected(state, {
                type: 'newsletterSubscriptions/unsubscribeSubscription',
                payload: { previousState, originalIndex: 0 },
                meta: {
                    arg: {
                        subscription: activeSubscription,
                        subscriptionIndex: 0,
                    },
                    requestId: 'test-request-id',
                    requestStatus: 'rejected',
                    aborted: false,
                    condition: false,
                    rejectedWithValue: true,
                },
                error: {},
            });

            expect(state.value?.tabs.active.ids).toEqual([activeSubscription.ID]);
            expect(state.value?.tabs.active.totalCount).toEqual(1);

            expect(state.value?.tabs.unsubscribe.ids).toEqual([]);
            expect(state.value?.tabs.unsubscribe.totalCount).toEqual(0);
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
    });

    describe('filterSubscriptionListPending', () => {
        it('should update the subscription with filter data', () => {
            state.value!.byId = {
                [activeSubscription.ID]: activeSubscription,
            };

            filterSubscriptionListPending(state, {
                type: 'newsletterSubscriptions/filterSubscriptionList',
                payload: undefined,
                meta: {
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
                },
            });

            expect(state.value?.byId[activeSubscription.ID].MarkAsRead).toEqual(true);
            expect(state.value?.byId[activeSubscription.ID].MoveToFolder).toEqual('folder-1');
        });
    });

    describe('filterSubscriptionListFulfilled', () => {
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
                meta: {
                    arg: {
                        subscription: activeSubscription,
                        subscriptionIndex: 0,
                        data: {
                            ApplyTo: 'All',
                        },
                    },
                    requestId: 'test-request-id',
                    requestStatus: 'fulfilled',
                },
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
                meta: {
                    arg: {
                        subscription: activeSubscription,
                        subscriptionIndex: 0,
                        data: {
                            ApplyTo: 'All',
                        },
                    },
                    requestId: 'test-request-id',
                    requestStatus: 'fulfilled',
                },
            });

            expect(state.value?.byId[activeSubscription.ID]).toEqual(newSubscription);
        });
    });

    describe('filterSubscriptionListRejected', () => {
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
                meta: {
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
                },
                error: {},
            });

            expect(state.value?.byId[activeSubscription.ID].Name).toEqual(previousState.Name);
            expect(state.value?.byId[activeSubscription.ID].UnsubscribedTime).toEqual(previousState.UnsubscribedTime);
            expect(state.value?.byId[activeSubscription.ID].ReceivedMessageCount).toEqual(
                previousState.ReceivedMessageCount
            );
        });
    });
    describe('fetchNextNewsletterSubscriptionsPageFulfilled', () => {});

    describe('updateSubscriptionPending', () => {
        it('should update the subscription with the new data', () => {
            state.value!.byId = {
                [activeSubscription.ID]: activeSubscription,
            };
            state.value!.tabs.active.ids = [activeSubscription.ID];
            state.value!.tabs.active.totalCount = 1;

            updateSubscriptionPending(state, {
                type: 'newsletterSubscriptions/updateSubscription',
                payload: undefined,
                meta: {
                    arg: {
                        subscription: activeSubscription,
                        data: {
                            Unsubscribed: true,
                        },
                    },
                    requestId: 'test-request-id',
                    requestStatus: 'pending',
                },
            });

            expect(state.value?.byId[activeSubscription.ID].UnsubscribedTime).not.toBe(0);
            expect(state.value?.tabs.active.totalCount).toEqual(0);

            expect(state.value?.tabs.unsubscribe.ids).toEqual([activeSubscription.ID]);
            expect(state.value?.tabs.unsubscribe.totalCount).toEqual(1);
            expect(state.value?.deletingSubscriptionId).toEqual(activeSubscription.ID);
        });
    });

    describe('updateSubscriptionRejected', () => {
        const meta: ReturnType<typeof updateSubscription.rejected>['meta'] = {
            arg: {
                subscription: activeSubscription,
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
            state.value!.tabs.unsubscribe.ids = [activeSubscription.ID];
            state.value!.tabs.unsubscribe.totalCount = 1;
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
            expect(state.value?.deletingSubscriptionId).toBeUndefined();
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
            const previousState = activeSubscription;

            updateSubscriptionRejected(state, {
                type: 'newsletterSubscriptions/unsubscribeSubscription',
                payload: { previousState, originalIndex: 0 },
                meta: {
                    arg: {
                        subscription: activeSubscription,
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
                },
                error: {},
            });

            expect(state.value?.tabs.active.ids).toEqual([activeSubscription.ID]);
            expect(state.value?.tabs.active.totalCount).toEqual(1);

            expect(state.value?.tabs.unsubscribe.ids).toEqual([]);
            expect(state.value?.tabs.unsubscribe.totalCount).toEqual(0);
        });
    });

    describe('updateSubscriptionFulfilled', () => {
        it('should update the subscription with the new data', () => {
            state.value!.byId = {
                [activeSubscription.ID]: activeSubscription,
            };

            updateSubscriptionFulfilled(state, {
                type: 'newsletterSubscriptions/updateSubscription',
                payload: {
                    NewsletterSubscription: {
                        ...activeSubscription,
                        UnsubscribedTime: 100,
                        ReceivedMessageCount: 10,
                    },
                },
                meta: {
                    arg: {
                        subscription: activeSubscription,
                        subscriptionIndex: 0,
                        data: {
                            Unsubscribed: true,
                        },
                    },
                    requestId: 'test-request-id',
                    requestStatus: 'fulfilled',
                },
            });

            expect(state.value?.byId[activeSubscription.ID].UnsubscribedTime).toEqual(100);
            expect(state.value?.byId[activeSubscription.ID].ReceivedMessageCount).toEqual(10);
        });
    });

    describe('handleServerEvent', () => {
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
        });
    });
});
