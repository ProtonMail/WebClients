import { act, renderHook } from '@testing-library/react';

import { LockMode } from '../../lib/auth/lock/types';
import { UnlockDeclinedError } from '../../utils/errors/errors';
import { useLockSetup } from './useLockSetup';

const mockGetBiometricsUnlockKey = jest.fn();
const mockCreateNotification = jest.fn();

jest.mock('react-redux', () => ({ useSelector: () => LockMode.BIOMETRICS }));
jest.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: mockCreateNotification }),
}));
jest.mock('../../components/Core/AuthStoreProvider', () => ({ useAuthStore: () => ({}) }));
jest.mock('../../components/Core/PassCoreProvider', () => ({
    usePassCore: () => ({ biometricsKeyAppBound: true, supportsBiometrics: () => Promise.resolve(true) }),
}));
jest.mock('../../components/Core/PermissionsProvider', () => ({ usePermissionsProvider: () => ({}) }));
jest.mock('../../components/Lock/PasswordUnlockProvider', () => ({
    usePasswordUnlock: () => jest.fn(),
    usePasswordTypeSwitch: () => jest.fn(),
}));
jest.mock('../../components/Lock/PinUnlockProvider', () => ({ usePinUnlock: () => jest.fn() }));
jest.mock('../../components/Lock/UnlockProvider', () => ({ useUnlock: () => jest.fn() }));
jest.mock('../../components/Organization/OrganizationProvider', () => ({ useOrganization: () => undefined }));
jest.mock('../../lib/auth/lock/biometrics/adapter', () => ({
    getBiometricsUnlockKey: (...args: unknown[]) => mockGetBiometricsUnlockKey(...args),
}));
jest.mock('../useFeatureFlag', () => ({ useFeatureFlag: () => false }));
jest.mock('../useRequest', () => ({ useActionRequest: () => ({ loading: false, dispatch: jest.fn() }) }));
jest.mock('./useDesktopUnlock', () => ({ useDesktopUnlock: () => jest.fn() }));

describe('useLockSetup', () => {
    beforeEach(() => jest.clearAllMocks());

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
