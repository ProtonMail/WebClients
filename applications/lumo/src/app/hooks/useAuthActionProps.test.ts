import { act, renderHook } from '@testing-library/react';

import { setNativeComposerVisibility } from '../remote/nativeComposerBridgeHelpers';
import { useAuthActionProps } from './useAuthActionProps';
import { useGuestMigration } from './useGuestMigration';
import { useLumoAuthAction } from './useLumoAuthAction';

jest.mock('../remote/nativeComposerBridgeHelpers');
jest.mock('./useGuestMigration');
jest.mock('./useLumoAuthAction');

const mockedUseGuestMigration = useGuestMigration as jest.Mock;
const mockedUseLumoAuthAction = useLumoAuthAction as jest.Mock;

const captureGuestState = jest.fn();
const trigger = jest.fn();

const clickEvent = () =>
    ({ preventDefault: jest.fn() }) as unknown as React.MouseEvent & {
        preventDefault: jest.Mock;
    };

const setup = ({
    isNativeAuthEnabled = false,
    userAgent = 'Mozilla/5.0',
}: { isNativeAuthEnabled?: boolean; userAgent?: string } = {}) => {
    Object.defineProperty(navigator, 'userAgent', { value: userAgent, configurable: true });
    mockedUseGuestMigration.mockReturnValue({ captureGuestState });
    mockedUseLumoAuthAction.mockReturnValue({ isEnabled: isNativeAuthEnabled, trigger });
};

describe('useAuthActionProps', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        captureGuestState.mockResolvedValue(true);
    });

    describe.each(['signin', 'signup'] as const)('%s', (action) => {
        // The native app draws its composer on top of the web view, so a CTA that leaves it visible
        // makes it overlap the account page it navigates to.
        it('hides the native composer', async () => {
            setup();
            const { result } = renderHook(() => useAuthActionProps(action));

            await act(() => result.current.onClick(clickEvent()));

            expect(setNativeComposerVisibility).toHaveBeenCalledWith(false);
        });

        it('captures the guest conversation for migration', async () => {
            setup();
            const { result } = renderHook(() => useAuthActionProps(action));

            await act(() => result.current.onClick(clickEvent()));

            expect(captureGuestState).toHaveBeenCalled();
        });

        it('hands over to the native auth bridge instead of navigating when it is available', async () => {
            setup({ isNativeAuthEnabled: true });
            const { result } = renderHook(() => useAuthActionProps(action));
            const event = clickEvent();

            await act(() => result.current.onClick(event));

            expect(event.preventDefault).toHaveBeenCalled();
            expect(trigger).toHaveBeenCalledWith(action);
            expect(result.current.path).toBe('');
        });

        it('still hides the composer when capturing the guest state fails', async () => {
            setup();
            captureGuestState.mockRejectedValue(new Error('nope'));
            jest.spyOn(console, 'error').mockImplementation(() => {});
            const { result } = renderHook(() => useAuthActionProps(action));

            await act(() => result.current.onClick(clickEvent()));

            expect(setNativeComposerVisibility).toHaveBeenCalledWith(false);
        });

        it('runs the caller side effect', async () => {
            setup();
            const onClick = jest.fn();
            const { result } = renderHook(() => useAuthActionProps(action, onClick));

            await act(() => result.current.onClick(clickEvent()));

            expect(onClick).toHaveBeenCalled();
        });
    });

    it('falls back to the web sign-in path, with the keep-me-signed-in mode forced, inside the app', () => {
        setup({ userAgent: 'ProtonLumo/2.0.0 (iOS/26.0.1; iPhone 17)' });

        const { result } = renderHook(() => useAuthActionProps('signin'));

        expect(result.current.path).toBe('?remember=3');
    });

    it('uses the plain sign-in path in a browser', () => {
        setup();

        const { result } = renderHook(() => useAuthActionProps('signin'));

        expect(result.current.path).toBe('');
    });

    it('uses the signup path', () => {
        setup();

        const { result } = renderHook(() => useAuthActionProps('signup'));

        expect(result.current.path).toBe('/signup');
    });
});
