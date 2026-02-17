import * as useSubscriptionModule from '@proton/account/subscription/hooks';
import type { Subscription } from '@proton/payments/core/subscription/interface';

import { buildSubscription } from '../builders';

jest.mock('@proton/account/subscription/hooks', () => ({
    __esModule: true,
    ...jest.requireActual('@proton/account/subscription/hooks'),
}));

export const mockUseSubscription = (value: [Partial<Subscription>?, boolean?] = []) => {
    const [subscription, cached = false] = value;
    const mockedUseSubscription = jest.spyOn(useSubscriptionModule, 'useSubscription');
    mockedUseSubscription.mockReturnValue([buildSubscription(undefined, subscription), Boolean(cached)]);
    return mockedUseSubscription;
};
