import { SubscriptionModel as SubscriptionModelInterface } from '@proton/shared/lib/interfaces';
import { SubscriptionModel, getSubscriptionModel } from '@proton/shared/lib/models/subscriptionModel';

type DeepPartial<T> = T extends object
    ? {
          [P in keyof T]?: DeepPartial<T[P]>;
      }
    : T;

type PartialSubscriptionModel = DeepPartial<SubscriptionModelInterface>;

describe('subscriptionModel', () => {
    describe('getSubscriptionModel()', () => {
        it('should expect the API response with two top-level properties: Subscription and UpcomingSubscription', async () => {
            const apiMock = () =>
                Promise.resolve({
                    Subscription: { ID: 'Subscription1' },
                    UpcomingSubscription: { ID: 'Subscription2' },
                });

            const result: PartialSubscriptionModel = await getSubscriptionModel(apiMock);
            expect(result).toEqual({
                ID: 'Subscription1',
                UpcomingSubscription: { ID: 'Subscription2' },
                isManagedByMozilla: false,
            });
        });

        it('should handle the case when there is no UpcomingSubscription', async () => {
            const apiMock = () =>
                Promise.resolve({
                    Subscription: { ID: 'Subscription1' },
                });

            const result: PartialSubscriptionModel = await getSubscriptionModel(apiMock);
            expect(result).toEqual({
                ID: 'Subscription1',
                UpcomingSubscription: undefined,
                isManagedByMozilla: false,
            });
        });

        it('should handle the case when UpcomingSubscription is null', async () => {
            const apiMock = () =>
                Promise.resolve({
                    Subscription: { ID: 'Subscription1' },
                    UpcomingSubscription: null,
                });

            const result: PartialSubscriptionModel = await getSubscriptionModel(apiMock);
            expect(result).toEqual({
                ID: 'Subscription1',
                UpcomingSubscription: null,
                isManagedByMozilla: false,
            });
        });
    });

    describe('SubscriptionModel.update', () => {
        it('should add the UpcomingSubscription from the events', () => {
            const model = {
                ID: 'Subscription1',
                isManagedByMozilla: false,
            };

            const events = {
                ID: 'Subscription1',
                UpcomingSubscription: { ID: 'Subscription2' },
            };

            const result: PartialSubscriptionModel = SubscriptionModel.update(model, events);
            expect(result).toEqual({
                ID: 'Subscription1',
                isManagedByMozilla: false,
                UpcomingSubscription: { ID: 'Subscription2' },
            });
        });

        it('should remove UpcomingSubscription when events does not have it', () => {
            const model = {
                ID: 'Subscription1',
                UpcomingSubscription: { ID: 'Subscription2' },
                isManagedByMozilla: false,
            };

            const events = {
                ID: 'Subscription1',
            };

            const result: PartialSubscriptionModel = SubscriptionModel.update(model, events);

            expect(result).toEqual({
                ID: 'Subscription1',
                UpcomingSubscription: undefined,
                isManagedByMozilla: false,
            });
        });

        it('should set UpcomingSubscription to null when events set it to null', () => {
            const model = {
                ID: 'Subscription1',
                UpcomingSubscription: { ID: 'Subscription2' },
                isManagedByMozilla: false,
            };

            const events = {
                ID: 'Subscription1',
                UpcomingSubscription: null,
            };

            const result: PartialSubscriptionModel = SubscriptionModel.update(model, events);

            expect(result).toEqual({
                ID: 'Subscription1',
                UpcomingSubscription: null,
                isManagedByMozilla: false,
            });
        });

        it('should do nothing if model does not have UpcomingSubscription, nor events', () => {
            const model = {
                ID: 'Subscription1',
                isManagedByMozilla: false,
            };

            const events = {
                ID: 'Subscription1',
            };

            const result: PartialSubscriptionModel = SubscriptionModel.update(model, events);
            expect(result).toEqual({
                ID: 'Subscription1',
                UpcomingSubscription: undefined,
                isManagedByMozilla: false,
            });
        });
    });
});
