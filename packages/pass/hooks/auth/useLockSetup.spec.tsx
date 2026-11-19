import { act, renderHook } from '@testing-library/react';

import { LockMode } from '../../lib/auth/lock/types';
import { UnlockDeclinedError } from '../../utils/errors/errors';
import { useLockSetup } from './useLockSetup';

const mockGetBiometricsUnlockKey = vi.fn();
const mockCreateNotification = vi.fn();

vi.mock('react-redux', () => ({ useSelector: () => LockMode.BIOMETRICS }));
vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: mockCreateNotification }),
}));
vi.mock('../../components/Core/AuthStoreProvider', () => ({ useAuthStore: () => ({}) }));
vi.mock('../../components/Core/PassCoreProvider', () => ({
    usePassCore: () => ({ biometricsKeyAppBound: true, supportsBiometrics: () => Promise.resolve(true) }),
}));
vi.mock('../../components/Core/PermissionsProvider', () => ({ usePermissionsProvider: () => ({}) }));
vi.mock('../../components/Lock/PasswordUnlockProvider', () => ({
    usePasswordUnlock: () => vi.fn(),
    usePasswordTypeSwitch: () => vi.fn(),
}));
vi.mock('../../components/Lock/PinUnlockProvider', () => ({ usePinUnlock: () => vi.fn() }));
vi.mock('../../components/Lock/UnlockProvider', () => ({ useUnlock: () => vi.fn() }));
vi.mock('../../components/Organization/OrganizationProvider', () => ({ useOrganization: () => undefined }));
vi.mock('../../lib/auth/lock/biometrics/adapter', () => ({
    getBiometricsUnlockKey: (...args: unknown[]) => mockGetBiometricsUnlockKey(...args),
}));
vi.mock('../useFeatureFlag', () => ({ useFeatureFlag: () => false }));
vi.mock('../useRequest', () => ({ useActionRequest: () => ({ loading: false, dispatch: vi.fn() }) }));
vi.mock('./useDesktopUnlock', () => ({ useDesktopUnlock: () => vi.fn() }));

describe('useLockSetup', () => {
    beforeEach(() => vi.clearAllMocks());

    test('reports loading while the biometric prompt of the current lock is open', async () => {
        let answerPrompt: (err: Error) => void = () => {};
        mockGetBiometricsUnlockKey.mockReturnValue(new Promise((_, reject) => (answerPrompt = reject)));

        const { result } = renderHook(() => useLockSetup());
        expect(result.current.lock.loading).toBe(false);

        let pending: Promise<void> = Promise.resolve();
        act(() => {
            pending = result.current.setLockMode(LockMode.PASSWORD);
        });
        expect(result.current.lock.loading).toBe(true);

        await act(async () => {
            answerPrompt(new UnlockDeclinedError());
            await pending;
        });

        expect(result.current.lock.loading).toBe(false);
        expect(mockCreateNotification).toHaveBeenCalledWith({ type: 'info', text: 'Canceled by user' });
        expect(mockGetBiometricsUnlockKey).toHaveBeenCalledTimes(1);
    });
});
