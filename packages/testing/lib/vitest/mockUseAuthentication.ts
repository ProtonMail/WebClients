import type { PrivateAuthenticationStore } from '@proton/components';
import * as useAuthenticationModule from '@proton/components/hooks/useAuthentication';

export const mockUseAuthentication = (value?: Partial<PrivateAuthenticationStore>) => {
    const spy = vi.spyOn(useAuthenticationModule, 'default');
    spy.mockReturnValue({
        getUID: vi.fn(),
        setUID: vi.fn(),
        setLocalID: vi.fn(),
        getLocalID: vi.fn(),
        hasSession: vi.fn(),
        setPassword: vi.fn(),
        getPassword: vi.fn(),
        setPersistent: vi.fn(),
        getPersistent: vi.fn(),
        setClientKey: vi.fn(),
        getClientKey: vi.fn(),
        setOfflineKey: vi.fn(),
        getOfflineKey: vi.fn(),
        setTrusted: vi.fn(),
        getTrusted: vi.fn(),
        logout: vi.fn(),
        login: vi.fn(),
        UID: '',
        mode: 'sso',
        localID: '',
        basename: '',
        ready: true,
        ...value,
    });
    return spy;
};
