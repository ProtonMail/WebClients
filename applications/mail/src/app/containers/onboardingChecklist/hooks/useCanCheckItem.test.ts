import { renderHook } from '@testing-library/react-hooks';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { PLANS } from '@proton/payments';

import useCanCheckItem from './useCanCheckItem';

jest.mock('@proton/account/user/hooks');
jest.mock('@proton/account/userSettings/hooks');
jest.mock('@proton/account/subscription/hooks');

const mockUseUser = useUser as jest.Mock;
const mockUseUserSettings = useUserSettings as jest.Mock;
const mockUseSubscription = useSubscription as jest.Mock;

describe('useCanCheckItem', () => {
    describe('get-started checklist', () => {
        afterEach(() => {
            mockUseUser.mockClear();
            mockUseUserSettings.mockClear();
            mockUseSubscription.mockClear();
        });

        it('should return true if user is free', () => {
            mockUseUser.mockReturnValue([{ isFree: true }]);
            mockUseSubscription.mockReturnValue([{}]);
            mockUseUserSettings.mockReturnValue([{}]);

            const { result } = renderHook(() => useCanCheckItem());
            expect(result.current.canMarkItemsAsDone).toBe(true);
        });

        it('should return true if free user with get-started checklist', () => {
            mockUseUser.mockReturnValue([{ isFree: true }]);
            mockUseSubscription.mockReturnValue([{}]);
            mockUseUserSettings.mockReturnValue([{ Checklists: ['get-started'] }]);

            const { result } = renderHook(() => useCanCheckItem());
            expect(result.current.canMarkItemsAsDone).toBe(true);
        });

        it('should return false if paid users with get-started checklist', () => {
            mockUseUser.mockReturnValue([{ isFree: false }]);
            mockUseSubscription.mockReturnValue([{}]);
            mockUseUserSettings.mockReturnValue([{ Checklists: ['get-started'] }]);

            const { result } = renderHook(() => useCanCheckItem());
            expect(result.current.canMarkItemsAsDone).toBe(false);
        });

        it('should return true if paid VPN user with get-started checklist', () => {
            mockUseUser.mockReturnValue([{ isFree: false }]);
            mockUseSubscription.mockReturnValue([{ Plans: [{ Name: PLANS.VPN }] }]);
            mockUseUserSettings.mockReturnValue([{ Checklists: ['get-started'] }]);

            const { result } = renderHook(() => useCanCheckItem());
            expect(result.current.canMarkItemsAsDone).toBe(true);
        });

        it('should return false if paid VPN user without get-started checklist', () => {
            mockUseUser.mockReturnValue([{ isFree: false }]);
            mockUseSubscription.mockReturnValue([{ Plans: [{ Name: PLANS.VPN }] }]);
            mockUseUserSettings.mockReturnValue([{ Checklists: [] }]);

            const { result } = renderHook(() => useCanCheckItem());
            expect(result.current.canMarkItemsAsDone).toBe(false);
        });

        it('should return false if paid MAIL user with get-started checklist', () => {
            mockUseUser.mockReturnValue([{ isFree: false }]);
            mockUseSubscription.mockReturnValue([{ Plans: [{ Name: PLANS.MAIL }] }]);
            mockUseUserSettings.mockReturnValue([{ Checklists: ['get-started'] }]);

            const { result } = renderHook(() => useCanCheckItem());
            expect(result.current.canMarkItemsAsDone).toBe(false);
        });
    });

    describe('paying-user', () => {
        it('should return true if user is free user with paying-user checklist', () => {
            mockUseUser.mockReturnValue([{ isFree: true }]);
            mockUseSubscription.mockReturnValue([{}]);
            mockUseUserSettings.mockReturnValue([{ Checklists: ['paying-user'] }]);

            const { result } = renderHook(() => useCanCheckItem());
            expect(result.current.canMarkItemsAsDone).toBe(true);
        });

        it('should return true if user is paid Mail user with paying-user checklist', () => {
            mockUseUser.mockReturnValue([{ isFree: false }]);
            mockUseSubscription.mockReturnValue([{ Plans: [{ Name: PLANS.MAIL }] }]);
            mockUseUserSettings.mockReturnValue([{ Checklists: ['paying-user'] }]);

            const { result } = renderHook(() => useCanCheckItem());
            expect(result.current.canMarkItemsAsDone).toBe(true);
        });

        it('should return false if user is paid Mail without paying-user checklist', () => {
            mockUseUser.mockReturnValue([{ isFree: false }]);
            mockUseSubscription.mockReturnValue([{ Plans: [{ Name: PLANS.MAIL }] }]);
            mockUseUserSettings.mockReturnValue([{ Checklists: [] }]);

            const { result } = renderHook(() => useCanCheckItem());
            expect(result.current.canMarkItemsAsDone).toBe(false);
        });
    });
});
