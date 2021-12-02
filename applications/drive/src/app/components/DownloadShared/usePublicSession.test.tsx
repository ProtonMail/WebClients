import { renderHook, act } from '@testing-library/react-hooks';

import { SRPHandshakeInfo } from '@proton/shared/lib/interfaces/drive/sharing';
import { useApi } from '@proton/components';
import { srpAuth } from '@proton/shared/lib/srp';

import usePublicSession, { AuthenticatePublicSesstion, QueryWithSessionInfo, SessionInfo } from './usePublicSession';

jest.mock('@proton/components/hooks/useApi');
jest.mock('@proton/shared/lib/srp');
const mockUseApi = useApi as jest.MockedFunction<typeof useApi>;
const mockSrpAuth = srpAuth as jest.MockedFunction<typeof srpAuth>;

const accessToken = 'accessToken123';
const sessionUID = 'sessionUID123';

describe('usePublicSession', () => {
    const mockApi = jest.fn().mockImplementation((query: object) => Promise.resolve(query));
    mockUseApi.mockReturnValue(mockApi);

    mockSrpAuth.mockImplementation(() => {
        return Promise.resolve({
            AccessToken: accessToken,
            UID: sessionUID,
            ServerProof: '',
        });
    });

    let hook: {
        current: {
            init: AuthenticatePublicSesstion;
            fetchSessionInfo: (
                token: string,
                password: string,
                handshakeInfo: SRPHandshakeInfo
            ) => Promise<SessionInfo>;
            queryWithSessionInfo: QueryWithSessionInfo;
        };
    };

    beforeEach(() => {
        const { result } = renderHook(() => usePublicSession());
        hook = result;
    });

    it('throws error for unauthenticated session', async () => {
        expect(() => {
            hook.current.queryWithSessionInfo({});
        }).toThrowError('Unauthenticated session');
    });

    it('stores session info after initialization', async () => {
        await act(async () => {
            const handshakeInfo = await hook.current.init('token');
            await hook.current.fetchSessionInfo('token', 'password', handshakeInfo);
        });

        const sessionInfo = hook.current.queryWithSessionInfo({ a: 'test' });
        expect(sessionInfo.headers['x-pm-uid']).toBe(sessionUID);
    });
});
