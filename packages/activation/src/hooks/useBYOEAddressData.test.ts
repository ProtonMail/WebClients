import { renderHook } from '@testing-library/react-hooks';

import { useAddresses } from '@proton/account/addresses/hooks';
import useBYOEAddressData from '@proton/activation/src/hooks/useBYOEAddressData';
import { ADDRESS_FLAGS, ADDRESS_TYPE } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { Address, User } from '@proton/shared/lib/interfaces';
import { ClaimableAddressType } from '@proton/shared/lib/keys';
import { addApiMock, hookWrapper, withApi } from '@proton/testing';

const wrapper = hookWrapper(withApi());

jest.mock('@proton/redux-shared-store/sharedProvider', () => ({
    __esModule: true,
    useDispatch: () => jest.fn(),
}));

jest.mock('@proton/components/hooks/useNotifications', () => ({
    __esModule: true,
    default: () => ({ createNotification: jest.fn() }),
}));

jest.mock('@proton/account/addresses/hooks');
const mockUseAddresses = useAddresses as jest.MockedFunction<any>;

jest.mock('@proton/account/user/hooks', () => ({
    useUser: () => [{ ID: 'byoe' } as User],
}));

const username = 'byoe';
const domain = 'proton.me';

const address = {
    DisplayName: 'BYOE user',
    Email: `${username}@gmail.com`,
    Receive: 1,
    Send: 1,
    Type: ADDRESS_TYPE.TYPE_EXTERNAL,
    Flags: ADDRESS_FLAGS.BYOE,
} as Address;

describe('useBYOEAddressData', () => {
    beforeAll(() => {
        addApiMock(
            'domains/available',
            () => {
                return { Domains: [domain] };
            },
            'get'
        );

        mockUseAddresses.mockReturnValue([[address], false]);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be possible to claim an address with a free username', async () => {
        addApiMock(
            'core/v4/users/available',
            () => {
                return { Code: 1000 };
            },
            'get'
        );

        const { result } = renderHook(() => useBYOEAddressData(), {
            wrapper,
        });

        // Wait for the hook loading time before checking results
        expect(result.current[1]).toBeTruthy();
        await wait(200);
        expect(result.current[1]).toBeFalsy();

        // Default data is correct
        expect(result.current[0]?.domains).toEqual([domain]);
        expect(result.current[0]?.claimableAddress).toEqual({
            username,
            domain,
            type: ClaimableAddressType.Any,
        });
    });

    it('should not be possible to claim an address with a used username', async () => {
        addApiMock(
            'core/v4/users/available',
            ({ params }) => {
                if (params.Name === `${username}@${domain}`) {
                    throw new Error('Username already exists');
                } else {
                    return { Code: 1000 };
                }
            },
            'get'
        );

        const { result } = renderHook(() => useBYOEAddressData(), {
            wrapper,
        });

        // Wait for the hook loading time before checking results
        expect(result.current[1]).toBeTruthy();
        await wait(200);
        expect(result.current[1]).toBeFalsy();

        // Default domain is correct, and no claimable address based on input data
        expect(result.current[0]?.domains).toEqual([domain]);
        expect(result.current[0]?.claimableAddress).toBeUndefined();
    });
});
