import type { User } from '@proton/shared/lib/interfaces';
import { formatUser } from '@proton/shared/lib/user/helpers';

import { MetricUserPlan } from '../../utils/type/MetricTypes';
import { getMetricsUserPlan } from './getMetricsUserPlan';

jest.mock('@proton/shared/lib/user/helpers');

const mockUser = {
    ID: 'test-user-id',
} as User;

const mockPaidUser = {
    ...mockUser,
    Subscribed: 1, // Used for isPaid before formatUser
} as User;

describe('getMetricsUserPlan', () => {
    const mockFormatUser = jest.mocked(formatUser);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('when in public context', () => {
        it('should return Anonymous when user is undefined', () => {
            const result = getMetricsUserPlan({ isPublicContext: true });
            expect(result).toBe(MetricUserPlan.Anonymous);
        });

        it('should return Free for non-paid user', () => {
            mockFormatUser.mockReturnValue({ isPaid: false } as any);

            const result = getMetricsUserPlan({ user: mockUser, isPublicContext: true });

            expect(mockFormatUser).toHaveBeenCalledWith(mockUser);
            expect(result).toBe(MetricUserPlan.Free);
        });

        it('should return Paid for paid user', () => {
            mockFormatUser.mockReturnValue({ isPaid: true } as any);

            const result = getMetricsUserPlan({ user: mockPaidUser, isPublicContext: true });

            expect(mockFormatUser).toHaveBeenCalledWith(mockPaidUser);
            expect(result).toBe(MetricUserPlan.Paid);
        });
    });

    describe('when in private context', () => {
        it('should return Unknown when user is undefined', () => {
            const result = getMetricsUserPlan({ isPublicContext: false });
            expect(result).toBe(MetricUserPlan.Unknown);
        });

        it('should return Free for non-paid user', () => {
            mockFormatUser.mockReturnValue({ isPaid: false } as any);

            const result = getMetricsUserPlan({ user: mockUser, isPublicContext: false });

            expect(mockFormatUser).toHaveBeenCalledWith(mockUser);
            expect(result).toBe(MetricUserPlan.Free);
        });

        it('should return Paid for paid user', () => {
            mockFormatUser.mockReturnValue({ isPaid: true } as any);

            const result = getMetricsUserPlan({ user: mockPaidUser, isPublicContext: false });

            expect(mockFormatUser).toHaveBeenCalledWith(mockPaidUser);
            expect(result).toBe(MetricUserPlan.Paid);
        });
    });

    it('should use default value for isPublicContext when not provided', () => {
        const result = getMetricsUserPlan({});
        expect(result).toBe(MetricUserPlan.Unknown);
    });
});
