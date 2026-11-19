import type { PublicKeyReference } from '@protontech/crypto';
import { CryptoProxy } from '@protontech/crypto';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useNotifications } from '@proton/app-context/useNotifications';
import noop from '@proton/utils/noop';

import { when } from '../testUtils/when';
import { ShareInviteeValidationError, VALIDATION_ERROR_TYPES } from './helpers/ShareInviteeValidationError';
import { useGetPublicKeysForEmail } from './helpers/useGetPublicKeysForEmail';
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

const mockedCreateNotification = vi.fn();
vi.mock('@proton/app-context/useApi', () => ({
    useApi: vi.fn().mockReturnValue(() => new Promise((resolve) => resolve(undefined))),
}));

vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: vi.fn(),
}));

vi.mocked(useNotifications).mockReturnValue({
    createNotification: mockedCreateNotification,
} as any);

vi.mock('@protontech/crypto');
const mockedImportPublicKey = vi.mocked(CryptoProxy.importPublicKey);

vi.mock('./helpers/useGetPublicKeysForEmail');
const mockedGetPrimaryPublicKey = vi.fn();
vi.mocked(useGetPublicKeysForEmail).mockReturnValue({
    getPrimaryPublicKeyForEmail: mockedGetPrimaryPublicKey,
    getPublicKeysForEmail: vi.fn(),
});

vi.mock('../../../../modules/flags', async () => ({
    ...(await vi.importActual('../../../../modules/flags')),
    useFlagsDriveDirectSharing: vi.fn().mockReturnValue({ isSharingExternalInviteDisabled: false }),
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
            .calledWith(inviteeInternal.email, expect.anything(), true)
            .mockResolvedValue(primaryPublicKey);

        when(mockedImportPublicKey).calledWith({ armoredKey: primaryPublicKey }).mockResolvedValue(publicKey);
    });
    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('add', () => {
        it('should be able to add proton/non-proton invitee', async () => {
            const { result } = renderHook(() => useShareInvitees([]));
            when(mockedGetPrimaryPublicKey)
                .calledWith(inviteeInternal2.email, expect.anything(), true)
                .mockResolvedValueOnce(undefined);

            act(() => {
                void result.current
                    .add([inviteeInternal, inviteeInternal2, inviteeExternalProton, inviteeExternalNonProton])
                    .catch(noop);
            });
            // Right after adding, all invitees are still loading
            expect(result.current.invitees).toEqual([
                { ...inviteeInternal, isLoading: true },
                { ...inviteeInternal2, isLoading: true },
                { ...inviteeExternalProton, isLoading: true },
                { ...inviteeExternalNonProton, isLoading: true },
            ]);

            await waitFor(() => expect(result.current.invitees.every((invitee) => !invitee.isLoading)).toBe(true));

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
            expect(mockedGetPrimaryPublicKey).toHaveBeenCalledWith(inviteeInternal.email, expect.anything(), true);
            expect(mockedGetPrimaryPublicKey).toHaveBeenCalledWith(inviteeInternal2.email, expect.anything(), true);
        });

        it('should show duplicate notification', async () => {
            const { result } = renderHook(() => useShareInvitees([]));

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
                text: `Removed duplicate invitees: \u2068${inviteeInternal.email}\u2069`,
            });
        });

        it('adding an existing invitee should add it with an error', async () => {
            const { result } = renderHook(() => useShareInvitees([inviteeInternal.email]));

            act(() => {
                result.current.add([inviteeInternal]).catch(noop);
            });

            await waitFor(() =>
                expect(result.current.invitees).toEqual([
                    {
                        ...inviteeInternal,
                        error: new ShareInviteeValidationError(VALIDATION_ERROR_TYPES.EXISTING_MEMBER),
                    },
                ])
            );
        });

        it('adding an invitee with bad email should add it with an error', async () => {
            const { result } = renderHook(() => useShareInvitees([]));

            act(() => {
                result.current.add([{ ...inviteeInternal, email: 'lucienTest.com' }]).catch(noop);
            });

            await waitFor(() =>
                expect(result.current.invitees).toEqual([
                    {
                        ...inviteeInternal,
                        email: 'lucienTest.com',
                        error: new ShareInviteeValidationError(VALIDATION_ERROR_TYPES.INVALID_EMAIL),
                    },
                ])
            );
        });

        it.skip('failed loadInvitee should show error notification', async () => {
            vi.spyOn(console, 'error').mockImplementationOnce(() => {});
            const { result } = renderHook(() => useShareInvitees([]));

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
                .calledWith(inviteeInternal2.email, expect.anything(), true)
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
            const abortSpy = vi.spyOn(AbortController.prototype, 'abort');
            const abortController = new AbortController();
            when(mockedGetPrimaryPublicKey)
                .calledWith(inviteeInternal2.email, abortController.signal, true)
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
