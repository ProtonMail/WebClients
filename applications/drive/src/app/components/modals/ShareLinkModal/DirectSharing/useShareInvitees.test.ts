import { act, renderHook } from '@testing-library/react-hooks';
import { verifyAllWhenMocksCalled, when } from 'jest-when';

import { useNotifications } from '@proton/components/hooks';
import { PublicKeyReference } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';

import { getPrimaryPublicKeyForEmail } from '../../../../utils/getPublicKeysForEmail';
import { ShareInviteeValdidationError, VALIDATION_ERROR_TYPES } from './helpers/ShareInviteeValidationError';
import { useShareInvitees } from './useShareInvitees';

// Internal and proton account
const inviteeInternal = {
    name: 'bob@proton.black',
    email: 'bob@proton.black',
};

// Internal and proton account
const inviteeInternal2 = {
    name: 'alice@proton.black',
    email: 'alice@proton.black',
};

// External account but proton one
const inviteeExternalProton = {
    name: 'jack@proton.me',
    email: 'jack@proton.me',
};

// External non-proton account
const inviteeExternalNonProton = {
    name: 'rob@jon.foo',
    email: 'rob@jon.foo',
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
            .calledWith(expect.anything(), inviteeInternal.email)
            .mockResolvedValue(primaryPublicKey);

        when(mockedImportPublicKey).calledWith({ armoredKey: primaryPublicKey }).mockResolvedValue(publicKey);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('add', () => {
        // TODO: We currently don't support non-proton account, update test after support
        it('should be able to add proton/non-proton invitee', async () => {
            const { result } = renderHook(() => useShareInvitees([]));
            when(mockedGetPrimaryPublicKey)
                .calledWith(expect.anything(), inviteeInternal2.email)
                .mockResolvedValueOnce(undefined);

            await act(async () => {
                result.current.add([
                    inviteeInternal,
                    inviteeInternal2,
                    inviteeExternalProton,
                    inviteeExternalNonProton,
                ]);
            });
            // @ts-ignore
            expect(result.all[1].invitees).toEqual([
                { ...inviteeInternal, isLoading: true },
                { ...inviteeInternal2, publicKey: undefined, isLoading: true },
                { ...inviteeExternalProton, error: new Error('External accounts are not supported yet') },
                { ...inviteeExternalNonProton, error: new Error('External accounts are not supported yet') },
            ]);

            expect(result.current.invitees).toEqual([
                { ...inviteeInternal, publicKey, isExternal: false, isLoading: false },
                {
                    ...inviteeInternal2,
                    isExternal: true,
                    error: new Error('Not a Proton account'),
                    isLoading: false,
                },
                {
                    ...inviteeExternalProton,
                    error: new Error('External accounts are not supported yet'),
                },
                {
                    ...inviteeExternalNonProton,
                    error: new Error('External accounts are not supported yet'),
                },
            ]);
            verifyAllWhenMocksCalled();
        });

        it('should show duplicate notification', async () => {
            const { result, waitFor } = renderHook(() => useShareInvitees([]));

            act(() => {
                result.current.add([inviteeInternal, inviteeInternal]);
            });

            await waitFor(() =>
                expect(result.current.invitees).toEqual([
                    { ...inviteeInternal, publicKey, isExternal: false, isLoading: false, error: undefined },
                ])
            );
            expect(mockedCreateNotification).toHaveBeenCalledWith({
                type: 'warning',
                text: `Removed duplicate invitees: ${inviteeInternal.email}`,
            });
        });

        it('adding an existing invitee should add it with an error', async () => {
            const { result, waitFor } = renderHook(() => useShareInvitees([inviteeInternal.email]));

            act(() => {
                result.current.add([inviteeInternal]);
            });

            await waitFor(() =>
                expect(result.current.invitees).toEqual([
                    {
                        ...inviteeInternal,
                        error: new ShareInviteeValdidationError(VALIDATION_ERROR_TYPES.EXISTING_MEMBER),
                    },
                ])
            );
        });

        it('adding an invitee with bad email should add it with an error', async () => {
            const { result, waitFor } = renderHook(() => useShareInvitees([]));

            act(() => {
                result.current.add([{ ...inviteeInternal, email: 'lucienTest.com' }]);
            });

            await waitFor(() =>
                expect(result.current.invitees).toEqual([
                    {
                        ...inviteeInternal,
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
                result.current.add([inviteeInternal]);
            });

            await waitFor(() => expect(result.current.invitees).toEqual([{ ...inviteeInternal, isLoading: true }]));

            await waitFor(() =>
                expect(result.current.invitees).toEqual([{ ...inviteeInternal, isLoading: false, error: error }])
            );

            expect(mockedCreateNotification).toHaveBeenCalledWith({
                type: 'error',
                text: error.message,
            });
        });
    });

    describe('remove', () => {
        it('should be able to remove an invitee added previously', async () => {
            when(mockedGetPrimaryPublicKey)
                .calledWith(expect.anything(), inviteeInternal2.email)
                .mockResolvedValue(primaryPublicKey);
            const { result } = renderHook(() => useShareInvitees([]));

            await act(async () => {
                result.current.add([inviteeInternal, inviteeInternal2]);
            });

            expect(result.current.invitees).toEqual([
                { ...inviteeInternal, publicKey, isExternal: false, isLoading: false },
                { ...inviteeInternal2, publicKey, isExternal: false, isLoading: false },
            ]);

            await act(async () => {
                result.current.remove(inviteeInternal.email);
            });

            expect(result.current.invitees).toEqual([
                { ...inviteeInternal2, publicKey, isExternal: false, isLoading: false },
            ]);
        });
    });

    describe('clean', () => {
        it('should be able to clean all invitees added previously', async () => {
            when(mockedGetPrimaryPublicKey)
                .calledWith(expect.anything(), inviteeInternal2.email)
                .mockResolvedValue(primaryPublicKey);
            const { result } = renderHook(() => useShareInvitees([]));

            await act(async () => {
                result.current.add([inviteeInternal, inviteeInternal2]);
            });
            expect(result.current.invitees).toEqual([
                { ...inviteeInternal, publicKey, isExternal: false, isLoading: false, error: undefined },
                { ...inviteeInternal2, publicKey, isExternal: false, isLoading: false, error: undefined },
            ]);

            await act(async () => {
                result.current.clean();
            });
        });
    });
});
