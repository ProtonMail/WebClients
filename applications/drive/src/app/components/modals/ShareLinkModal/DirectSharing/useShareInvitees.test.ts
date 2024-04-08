import { act, renderHook } from '@testing-library/react-hooks';
import { verifyAllWhenMocksCalled, when } from 'jest-when';

import { useNotifications } from '@proton/components/hooks';
import { PublicKeyReference } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';

import { getPrimaryPublicKeyForEmail } from '../../../../utils/getPublicKeysForEmail';
import { ShareInviteeValdidationError, VALIDATION_ERROR_TYPES } from './helpers/ShareInviteeValidationError';
import { useShareInvitees } from './useShareInvitees';

const invitee = {
    name: 'test2@proton.black',
    email: 'test2@proton.black',
};

const invitee2 = {
    name: 'test3@proton.black',
    email: 'test3@proton.black',
};

const mockedCreateNotification = jest.fn();
jest.mock('@proton/components/hooks', () => ({
    useGetEncryptionPreferences: jest.fn(),
    useNotifications: jest.fn(),
    useApi: jest.fn().mockReturnValue(() => new Promise((resolve) => resolve(undefined))),
}));

jest.mocked(useNotifications).mockReturnValue({
    createNotification: mockedCreateNotification,
} as any);

jest.mock('@proton/crypto');
const mockedImportPublicKey = jest.mocked(CryptoProxy.importPublicKey);

jest.mock('../../../../utils/getPublicKeysForEmail');
const mockedGetPrimaryPublicKey = jest.mocked(getPrimaryPublicKeyForEmail);

const primaryPublicKey = 'primaryPublicKey';
const publicKey = {
    _idx: 1868513808,
    _keyContentHash: ['dashdhuiwy323213dsahjeg123g21312', '123heiuwqhdqighdy1t223813y2weaseguy'],
    subkeys: [{}],
} as PublicKeyReference;

describe('useShareInvitees', () => {
    beforeEach(() => {
        when(mockedGetPrimaryPublicKey)
            .calledWith(expect.anything(), invitee.email)
            .mockResolvedValue(primaryPublicKey);
        when(mockedImportPublicKey).calledWith({ armoredKey: primaryPublicKey }).mockResolvedValue(publicKey);
        when(mockedGetPrimaryPublicKey).calledWith(expect.anything(), invitee2.email).mockResolvedValue(undefined);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('add', () => {
        it('should be able to add proton/non-proton invitee', async () => {
            when(mockedGetPrimaryPublicKey)
                .calledWith(expect.anything(), invitee.email)
                .mockResolvedValue(primaryPublicKey);
            when(mockedImportPublicKey).calledWith({ armoredKey: primaryPublicKey }).mockResolvedValue(publicKey);
            when(mockedGetPrimaryPublicKey).calledWith(expect.anything(), invitee2.email).mockResolvedValue(undefined);
            const { result } = renderHook(() => useShareInvitees([]));

            await act(async () => {
                result.current.add([invitee, invitee2]);
            });
            // @ts-ignore
            expect(result.all[1].invitees).toEqual([
                { ...invitee, isLoading: true },
                { ...invitee2, isLoading: true },
            ]);

            expect(result.current.count).toBe(2);
            expect(result.current.invitees).toEqual([
                { ...invitee, publicKey, isExternal: false, isLoading: false },
                { ...invitee2, publicKey: undefined, isExternal: true, isLoading: false },
            ]);
            verifyAllWhenMocksCalled();
        });

        it('should show duplicate notification', async () => {
            const { result, waitFor } = renderHook(() => useShareInvitees([]));

            act(() => {
                result.current.add([invitee, invitee]);
            });

            await waitFor(() =>
                expect(result.current.invitees).toEqual([
                    { ...invitee, publicKey, isExternal: false, isLoading: false, error: undefined },
                ])
            );
            expect(mockedCreateNotification).toHaveBeenCalledWith({
                type: 'warning',
                text: `Removed duplicate invitees: ${invitee.email}`,
            });
        });

        it('adding an existing invitee should add it with an error', async () => {
            const { result, waitFor } = renderHook(() => useShareInvitees([invitee.email]));

            act(() => {
                result.current.add([invitee]);
            });

            await waitFor(() =>
                expect(result.current.invitees).toEqual([
                    {
                        ...invitee,
                        error: new ShareInviteeValdidationError(VALIDATION_ERROR_TYPES.EXISTING_MEMBER),
                    },
                ])
            );
        });

        it('adding an invitee with bad email should add it with an error', async () => {
            const { result, waitFor } = renderHook(() => useShareInvitees([]));

            act(() => {
                result.current.add([{ ...invitee, email: 'lucienTest.com' }]);
            });

            await waitFor(() =>
                expect(result.current.invitees).toEqual([
                    {
                        ...invitee,
                        email: 'lucienTest.com',
                        error: new ShareInviteeValdidationError(VALIDATION_ERROR_TYPES.INVALID_EMAIL),
                    },
                ])
            );
        });

        it.skip('failed loadInvitee should show error notification', async () => {
            jest.spyOn(console, 'error').mockImplementationOnce(() => {});
            const { result, waitFor } = renderHook(() => useShareInvitees([]));

            const error = new Error('This is an error');

            act(() => {
                result.current.add([invitee]);
            });

            await waitFor(() => expect(result.current.invitees).toEqual([{ ...invitee, isLoading: true }]));

            await waitFor(() =>
                expect(result.current.invitees).toEqual([{ ...invitee, isLoading: false, error: error }])
            );

            expect(mockedCreateNotification).toHaveBeenCalledWith({
                type: 'error',
                text: error.message,
            });
        });
    });

    describe('remove', () => {
        it('should be able to remove an invitee added previously', async () => {
            const { result } = renderHook(() => useShareInvitees([]));

            await act(async () => {
                result.current.add([invitee, invitee2]);
            });

            expect(result.current.count).toBe(2);
            expect(result.current.invitees).toEqual([
                { ...invitee, publicKey, isExternal: false, isLoading: false, error: undefined },
                { ...invitee2, publicKey: undefined, isExternal: true, isLoading: false, error: undefined },
            ]);

            await act(async () => {
                result.current.remove(invitee.email);
            });
            expect(result.current.count).toBe(1);

            expect(result.current.invitees).toEqual([
                { ...invitee2, publicKey: undefined, isExternal: true, isLoading: false },
            ]);
        });
    });

    describe('clean', () => {
        it('should be able to clean all invitees added previously', async () => {
            const { result } = renderHook(() => useShareInvitees([]));

            await act(async () => {
                result.current.add([invitee, invitee2]);
            });
            expect(result.current.count).toBe(2);
            expect(result.current.invitees).toEqual([
                { ...invitee, publicKey, isExternal: false, isLoading: false, error: undefined },
                { ...invitee2, publicKey: undefined, isExternal: true, isLoading: false },
            ]);

            await act(async () => {
                result.current.clean();
            });

            expect(result.current.count).toBe(0);
        });
    });
});
