import * as useSubscriptionModule from '@proton/account/subscription/hooks';
import { SubscriptionModel } from '@proton/shared/lib/interfaces';

import { buildSubscription } from '../builders';

export const mockUseSubscription = (value: [Partial<SubscriptionModel>?, boolean?] = []) => {
    const [subscription, cached = false] = value;
    const mockedUseSubscription = jest.spyOn(useSubscriptionModule, 'useSubscription');
    mockedUseSubscription.mockReturnValue([buildSubscription(subscription), Boolean(cached)]);
    return mockedUseSubscription;
};
