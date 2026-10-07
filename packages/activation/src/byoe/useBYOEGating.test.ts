import { renderHook } from '@testing-library/react';

import { useUser } from '@proton/account/user/hooks';
import { PRODUCT_BIT } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';

import { MAX_SYNC_FREE_USER, MAX_SYNC_PAID_USER } from '../constants';
import useBYOEAddressesCounts from '../hooks/useBYOEAddressesCounts';
import useBYOEFeatureStatus from '../hooks/useBYOEFeatureStatus';
import { useBYOEGating } from './useBYOEGating';

jest.mock('@proton/account/user/hooks');
jest.mock('@proton/unleash/useFlag');
jest.mock('../hooks/useBYOEAddressesCounts');
jest.mock('../hooks/useBYOEFeatureStatus');

const mockUseUser = useUser as jest.Mock;
const mockUseFlag = useFlag as jest.Mock;
const mockUseCounts = useBYOEAddressesCounts as jest.Mock;
const mockUseFeatureStatus = useBYOEFeatureStatus as jest.Mock;

describe('useBYOEGating', () => {
    it('should be ok for a user with access and room', () => {
        mockUseUser.mockReturnValue([{ Subscribed: 0 }, false]);
        mockUseFeatureStatus.mockReturnValue([true, false]);
        mockUseFlag.mockReturnValue(false);
        mockUseCounts.mockReturnValue({
            activeBYOEAddresses: new Array(0).fill({}),
            isLoadingAddressesCount: false,
        });
        const { result } = renderHook(() => useBYOEGating());

        expect(result.current.checkGating()).toBe('ok');
    });

    it('should report no-access when the feature is not available', () => {
        mockUseUser.mockReturnValue([{ Subscribed: 0 }, false]);
        mockUseFeatureStatus.mockReturnValue([false, false]);
        mockUseFlag.mockReturnValue(false);
        mockUseCounts.mockReturnValue({
            activeBYOEAddresses: new Array(0).fill({}),
            isLoadingAddressesCount: false,
        });
        const { result } = renderHook(() => useBYOEGating());

        expect(result.current.checkGating()).toBe('no-access');
    });

    it('should report feature-disabled when creation is disabled', () => {
        mockUseUser.mockReturnValue([{ Subscribed: 0 }, false]);
        mockUseFeatureStatus.mockReturnValue([true, false]);
        mockUseFlag.mockReturnValue(true);
        mockUseCounts.mockReturnValue({
            activeBYOEAddresses: new Array(0).fill({}),
            isLoadingAddressesCount: false,
        });
        const { result } = renderHook(() => useBYOEGating());

        expect(result.current.checkGating()).toBe('feature-disabled');
    });

    it('should not report feature-disabled without access', () => {
        mockUseUser.mockReturnValue([{ Subscribed: 0 }, false]);
        mockUseFeatureStatus.mockReturnValue([false, false]);
        mockUseFlag.mockReturnValue(true);
        mockUseCounts.mockReturnValue({
            activeBYOEAddresses: new Array(0).fill({}),
            isLoadingAddressesCount: false,
        });
        const { result } = renderHook(() => useBYOEGating());

        expect(result.current.checkGating()).toBe('no-access');
    });

    it('should report free-limit', () => {
        mockUseUser.mockReturnValue([{ Subscribed: 0 }, false]);
        mockUseFeatureStatus.mockReturnValue([true, false]);
        mockUseFlag.mockReturnValue(false);
        mockUseCounts.mockReturnValue({
            activeBYOEAddresses: new Array(MAX_SYNC_FREE_USER).fill({}),
            isLoadingAddressesCount: false,
        });
        const { result } = renderHook(() => useBYOEGating());

        expect(result.current.checkGating()).toBe('free-limit');
    });

    it('should report paid-limit', () => {
        mockUseUser.mockReturnValue([{ Subscribed: PRODUCT_BIT.MAIL }, false]);
        mockUseFeatureStatus.mockReturnValue([true, false]);
        mockUseFlag.mockReturnValue(false);
        mockUseCounts.mockReturnValue({
            activeBYOEAddresses: new Array(MAX_SYNC_PAID_USER).fill({}),
            isLoadingAddressesCount: false,
        });
        const { result } = renderHook(() => useBYOEGating());

        expect(result.current.checkGating()).toBe('paid-limit');
    });

    it('should apply limits even without access (forwardings count too)', () => {
        mockUseUser.mockReturnValue([{ Subscribed: 0 }, false]);
        mockUseFeatureStatus.mockReturnValue([false, false]);
        mockUseFlag.mockReturnValue(false);
        mockUseCounts.mockReturnValue({
            activeBYOEAddresses: new Array(MAX_SYNC_FREE_USER).fill({}),
            isLoadingAddressesCount: false,
        });
        const { result } = renderHook(() => useBYOEGating());

        expect(result.current.checkGating()).toBe('free-limit');
    });

    it('should be loading when the user is loading', () => {
        mockUseUser.mockReturnValue([{ Subscribed: 0 }, true]);
        mockUseFeatureStatus.mockReturnValue([true, false]);
        mockUseFlag.mockReturnValue(false);
        mockUseCounts.mockReturnValue({
            activeBYOEAddresses: new Array(0).fill({}),
            isLoadingAddressesCount: false,
        });
        const { result } = renderHook(() => useBYOEGating());

        expect(result.current.isLoadingGating).toBe(true);
    });

    it('should be loading when the feature status is loading', () => {
        mockUseUser.mockReturnValue([{ Subscribed: 0 }, false]);
        mockUseFeatureStatus.mockReturnValue([true, true]);
        mockUseFlag.mockReturnValue(false);
        mockUseCounts.mockReturnValue({
            activeBYOEAddresses: new Array(0).fill({}),
            isLoadingAddressesCount: false,
        });
        const { result } = renderHook(() => useBYOEGating());

        expect(result.current.isLoadingGating).toBe(true);
    });

    it('should be loading when the addresses count is loading', () => {
        mockUseUser.mockReturnValue([{ Subscribed: 0 }, false]);
        mockUseFeatureStatus.mockReturnValue([true, false]);
        mockUseFlag.mockReturnValue(false);
        mockUseCounts.mockReturnValue({
            activeBYOEAddresses: new Array(0).fill({}),
            isLoadingAddressesCount: true,
        });
        const { result } = renderHook(() => useBYOEGating());

        expect(result.current.isLoadingGating).toBe(true);
    });

    it('should not be loading once everything is loaded', () => {
        mockUseUser.mockReturnValue([{ Subscribed: 0 }, false]);
        mockUseFeatureStatus.mockReturnValue([true, false]);
        mockUseFlag.mockReturnValue(false);
        mockUseCounts.mockReturnValue({
            activeBYOEAddresses: new Array(0).fill({}),
            isLoadingAddressesCount: false,
        });
        const { result } = renderHook(() => useBYOEGating());

        expect(result.current.isLoadingGating).toBe(false);
    });
});
