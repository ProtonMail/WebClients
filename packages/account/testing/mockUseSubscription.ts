import type { Subscription } from '@proton/payments/core/subscription/interface';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';

import * as useSubscriptionModule from '../subscription/hooks';

jest.mock('../subscription/hooks', () => ({
    __esModule: true,
    ...jest.requireActual('../subscription/hooks'),
}));

export const mockUseSubscription = (value: [Partial<Subscription>?, boolean?] = []) => {
    const [subscription, cached = false] = value;
    const mockedUseSubscription = jest.spyOn(useSubscriptionModule, 'useSubscription');
    mockedUseSubscription.mockReturnValue([buildSubscription(undefined, subscription), Boolean(cached)]);
    return mockedUseSubscription;
};
