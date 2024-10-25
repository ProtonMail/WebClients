import { act, renderHook } from '@testing-library/react-hooks';
import { verifyAllWhenMocksCalled, when } from 'jest-when';

import { useNotifications } from '@proton/components';
import type { PublicKeyReference } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import noop from '@proton/utils/noop';

import { useGetPublicKeysForEmail } from '../../../../../app/store';
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
jest.mock('@proton/components', () => ({
    useGetEncryptionPreferences: jest.fn(),
    useNotifications: jest.fn(),
    useApi: jest.fn().mockReturnValue(() => new Promise((resolve) => resolve(undefined))),
}));

jest.mocked(useNotifications).mockReturnValue({
    createNotification: mockedCreateNotification,
} as any);

jest.mock('@proton/crypto');
const mockedImportPublicKey = jest.mocked(CryptoProxy.importPublicKey);

jest.mock('../../../../store/_user/useGetPublicKeysForEmail');
const mockedGetPrimaryPublicKey = jest.fn();
jest.mocked(useGetPublicKeysForEmail).mockReturnValue({
    getPrimaryPublicKeyForEmail: mockedGetPrimaryPublicKey,
    getPublicKeysForEmail: jest.fn(),
});

jest.mock('../../../../store/_shares/useDriveSharingFlags', () => ({
    useDriveSharingFlags: jest
        .fn()
        .mockReturnValue({ isSharingExternalInviteDisabled: false, isSharingExternalInviteAvailable: true }),
}));

const primaryPublicKey = 'primaryPublicKey';
const publicKey = {
    _idx: 1868513808,
    _keyContentHash: ['dashdhuiwy323213dsahjeg123g21312', '123heiuwqhdqighdy1t223813y2weaseguy'],
    subkeys: [{}],
} as PublicKeyReference;

describe('useShareInvitees', () => {
    beforeEach(() => {
        when(mockedGetPrimaryPublicKey)
            .calledWith(inviteeInternal.email, new AbortController().signal)
            .mockResolvedValue(primaryPublicKey);

        when(mockedImportPublicKey).calledWith({ armoredKey: primaryPublicKey }).mockResolvedValue(publicKey);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('add', () => {
        it('should be able to add proton/non-proton invitee', async () => {
            const { result } = renderHook(() => useShareInvitees([]));
            when(mockedGetPrimaryPublicKey)
                .calledWith(inviteeInternal2.email, new AbortController().signal)
                .mockResolvedValueOnce(undefined);

            await act(async () => {
                void result.current
                    .add([inviteeInternal, inviteeInternal2, inviteeExternalProton, inviteeExternalNonProton])
                    .catch(noop);
            });
            // @ts-ignore
            expect(result.all[1].invitees).toEqual([
                { ...inviteeInternal, isLoading: true },
                { ...inviteeInternal2, isLoading: true },
                { ...inviteeExternalProton, isLoading: true },
                { ...inviteeExternalNonProton, isLoading: true },
            ]);

            expect(result.current.invitees).toEqual([
                { ...inviteeInternal, publicKey, isExternal: false, isLoading: false },
                {
                    ...inviteeInternal2,
                    isExternal: true,
                    error: undefined,
                    isLoading: false,
                },
                {
                    ...inviteeExternalProton,
                    error: undefined,
                    isExternal: true,
                    isLoading: false,
                },
                {
                    ...inviteeExternalNonProton,
                    error: undefined,
                    isExternal: true,
                    isLoading: false,
                },
            ]);
            verifyAllWhenMocksCalled();
        });

        it('should show duplicate notification', async () => {
            const { result, waitFor } = renderHook(() => useShareInvitees([]));

            act(() => {
                result.current.add([inviteeInternal, inviteeInternal]).catch(noop);
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
                result.current.add([inviteeInternal]).catch(noop);
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
                result.current.add([{ ...inviteeInternal, email: 'lucienTest.com' }]).catch(noop);
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
                result.current.add([inviteeInternal]).catch(noop);
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
                .calledWith(inviteeInternal2.email, new AbortController().signal)
                .mockResolvedValue(primaryPublicKey);
            const { result } = renderHook(() => useShareInvitees([]));

            await act(async () => {
                result.current.add([inviteeInternal, inviteeInternal2]).catch(noop);
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
        it('should be able to clean all invitees added previously and abort requests', async () => {
            const abortSpy = jest.spyOn(AbortController.prototype, 'abort');
            const abortController = new AbortController();
            when(mockedGetPrimaryPublicKey)
                .calledWith(inviteeInternal2.email, abortController.signal)
                .mockResolvedValue(primaryPublicKey);
            const { result } = renderHook(() => useShareInvitees([]));

            await act(async () => {
                result.current.add([inviteeInternal, inviteeInternal2]).catch(noop);
            });
            expect(result.current.invitees).toEqual([
                { ...inviteeInternal, publicKey, isExternal: false, isLoading: false, error: undefined },
                { ...inviteeInternal2, publicKey, isExternal: false, isLoading: false, error: undefined },
            ]);

            await act(async () => {
                result.current.clean();
            });

            expect(result.current.invitees).toEqual([]);
            expect(abortSpy).toHaveBeenCalledTimes(1);
        });
    });
});
