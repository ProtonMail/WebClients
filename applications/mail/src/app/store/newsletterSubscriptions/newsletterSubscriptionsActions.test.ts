import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';

import type { MailState } from '../rootReducer';
import type { MailThunkExtra } from '../store';
import { SortSubscriptionsValue, SubscriptionTabs } from './interface';
import { deleteNewsletterSubscription, sortSubscriptionList } from './newsletterSubscriptionsActions';
import { newsletterSubscriptionName } from './newsletterSubscriptionsSlice';

const mockApiFn = jest.fn();
const mockApi = Object.assign(mockApiFn, {
    UID: undefined,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
});

const mockGetState = jest.fn();
const mockDispatch = jest.fn();

const mockExtra: MailThunkExtra = {
    state: {} as MailState,
    dispatch: mockDispatch,
    extra: {
        api: mockApi,
        calendarModelEventManager: {} as any,
        notificationManager: {} as any,
        eventManager: {} as any,
        history: {} as any,
        unleashClient: {} as any,
        authentication: {} as any,
        config: {} as any,
    },
};

describe('newsletterSubscriptions actions', () => {
    describe('sortSubscriptionList', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should call API with correct parameters when sorting active subscriptions and most frequent', async () => {
            const thunk = sortSubscriptionList(SortSubscriptionsValue.MostRead);

            mockGetState.mockReturnValue({
                [newsletterSubscriptionName]: {
                    value: {
                        selectedTab: SubscriptionTabs.Active,
                    },
                },
            });

            await thunk(mockDispatch, mockGetState, mockExtra.extra);

            expect(mockApi).toHaveBeenCalledWith({
                url: 'mail/v4/newsletter-subscriptions?PageSize=100&Active=1&Spam=0&Sort[UnreadMessageCount]=DESC&Sort[ID]=DESC',
                method: 'GET',
            });
        });

        it('should call API with correct parameters when sorting active subscriptions', async () => {
            const thunk = sortSubscriptionList(SortSubscriptionsValue.Alphabetical);

            mockGetState.mockReturnValue({
                [newsletterSubscriptionName]: {
                    value: {
                        selectedTab: SubscriptionTabs.Active,
                    },
                },
            });

            await thunk(mockDispatch, mockGetState, mockExtra.extra);

            expect(mockApi).toHaveBeenCalledWith({
                url: 'mail/v4/newsletter-subscriptions?PageSize=100&Active=1&Spam=0&Sort[Name]=ASC&Sort[ID]=DESC',
                method: 'GET',
            });
        });

        it('should call API with correct parameters when sorting inactive subscriptions', async () => {
            const thunk = sortSubscriptionList(SortSubscriptionsValue.Alphabetical);

            mockGetState.mockReturnValue({
                [newsletterSubscriptionName]: {
                    value: {
                        selectedTab: SubscriptionTabs.Unsubscribe,
                    },
                },
            });

            await thunk(mockDispatch, mockGetState, mockExtra.extra);

            expect(mockApi).toHaveBeenCalledWith({
                url: 'mail/v4/newsletter-subscriptions?PageSize=100&Active=0&Spam=0&Sort[Name]=ASC&Sort[ID]=DESC',
                method: 'GET',
            });
        });
    });

    describe('deleteNewsletterSubscription', () => {
        it('should call API with correct parameters when deleting a subscription', async () => {
            const thunk = deleteNewsletterSubscription({
                subscription: {
                    ID: 'active-1',
                } as NewsletterSubscription,
                subscriptionIndex: 0,
            });

            await thunk(mockDispatch, mockGetState, mockExtra.extra);

            expect(mockApi).toHaveBeenCalledWith({
                url: `mail/v4/newsletter-subscriptions/active-1`,
                method: 'DELETE',
            });
        });
    });
});
