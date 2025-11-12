import { renderHook } from '@testing-library/react-hooks';
import { sub } from 'date-fns';

import { ApiSyncState } from '@proton/activation/src/api/api.interface';
import { ImportType } from '@proton/activation/src/interface';
import { ADDRESS_FLAGS, ADDRESS_RECEIVE, ADDRESS_SEND, ADDRESS_STATUS } from '@proton/shared/lib/constants';
import type { Address } from '@proton/shared/lib/interfaces/Address';

import useShowBYOESpotlightModal from './useShowBYOESpotlightModal';

jest.mock('@proton/account/addresses/hooks', () => ({
    useAddresses: jest.fn(),
}));

jest.mock('@proton/account/user/hooks', () => ({
    useUser: jest.fn(),
}));

jest.mock('@proton/activation/src/logic/store', () => ({
    useEasySwitchSelector: jest.fn(),
}));

jest.mock('@proton/activation/src/logic/sync/sync.selectors', () => ({
    getAllSync: jest.fn(),
    selectSyncListLoadingState: jest.fn(),
}));

jest.mock('@proton/activation/src/hooks/useBYOEFeatureStatus', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('proton-mail/containers/globalModals/GlobalModalProvider', () => ({
    useMailGlobalModals: jest.fn(() => ({ notify: jest.fn() })),
}));

jest.mock('@proton/features/useFeature');

jest.mock('./useShowBYOESpotlightModal', () => ({
    __esModule: true,
    ...jest.requireActual('./useShowBYOESpotlightModal'),
}));

const enabledBYOEAddress = {
    Email: 'test@gmail.com',
    Status: ADDRESS_STATUS.STATUS_ENABLED,
    Receive: ADDRESS_RECEIVE.RECEIVE_YES,
    Flags: ADDRESS_FLAGS.BYOE,
} as Address;

const internalAddress = {
    Email: 'internalAddress1@proton.me',
    Status: ADDRESS_STATUS.STATUS_ENABLED,
    Receive: ADDRESS_RECEIVE.RECEIVE_YES,
    Send: ADDRESS_SEND.SEND_YES,
} as Address;

const sync1 = {
    id: 'sync1',
    account: 'test@gmail.com',
    importerID: 'importer1',
    product: ImportType.MAIL,
    state: ApiSyncState.ACTIVE,
    startDate: 0,
};

describe('useShowBYOESpotlightModal', () => {
    const mockUseAddresses = require('@proton/account/addresses/hooks').useAddresses;
    const mockUseUser = require('@proton/account/user/hooks').useUser;
    const mockUseEasySwitchSelector = require('@proton/activation/src/logic/store').useEasySwitchSelector;
    const mockGetAllSync = require('@proton/activation/src/logic/sync/sync.selectors').getAllSync;
    const mockSelectSyncListLoadingState =
        require('@proton/activation/src/logic/sync/sync.selectors').selectSyncListLoadingState;
    const mockUseBYOEFeatureStatus = require('@proton/activation/src/hooks/useBYOEFeatureStatus').default as jest.Mock;
    const mockUseFeature = require('@proton/features/useFeature').default as jest.Mock;
    const mockNotify = require('proton-mail/containers/globalModals/GlobalModalProvider').useMailGlobalModals;
    const openModalSpy = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        mockNotify.mockReturnValue({ notify: openModalSpy });

        // Setup useEasySwitchSelector to return different values based on the selector passed
        mockUseEasySwitchSelector.mockImplementation((selector: any) => {
            if (selector === mockGetAllSync) {
                return mockGetAllSync();
            }
            if (selector === mockSelectSyncListLoadingState) {
                return mockSelectSyncListLoadingState();
            }
            return undefined;
        });
    });

    it('should open the BYOE spotlight modal', () => {
        const addresses = [internalAddress];
        const user = { CreateTime: Math.floor(sub(new Date(), { months: 3 }).getTime() / 1000) };
        const syncs = [sync1];

        mockUseBYOEFeatureStatus.mockReturnValue(true);
        mockUseAddresses.mockReturnValue([addresses]);
        mockUseUser.mockReturnValue([user]);
        mockGetAllSync.mockReturnValue(syncs);
        mockSelectSyncListLoadingState.mockReturnValue('success');
        mockUseFeature.mockReturnValue({ feature: { Value: true } as any, update: jest.fn() });

        renderHook(() => useShowBYOESpotlightModal());

        expect(openModalSpy).toHaveBeenCalled();
    });

    it('should not open the BYOE spotlight modal when user is new', () => {
        const addresses = [internalAddress];
        // user created the account 3 days ago
        const user = { CreateTime: Math.floor(sub(new Date(), { days: 3 }).getTime() / 1000) };
        const syncs = [sync1];

        mockUseBYOEFeatureStatus.mockReturnValue(true);
        mockUseAddresses.mockReturnValue([addresses]);
        mockUseUser.mockReturnValue([user]);
        mockGetAllSync.mockReturnValue(syncs);
        mockSelectSyncListLoadingState.mockReturnValue('success');
        mockUseFeature.mockReturnValue({ feature: { Value: true } as any, update: jest.fn() });

        renderHook(() => useShowBYOESpotlightModal());

        expect(openModalSpy).not.toHaveBeenCalled();
    });

    it('should not open the BYOE spotlight modal when user is BYOE only account', () => {
        const addresses = [enabledBYOEAddress];
        const user = { CreateTime: Math.floor(sub(new Date(), { months: 3 }).getTime() / 1000) };
        const syncs = [sync1];

        mockUseBYOEFeatureStatus.mockReturnValue(true);
        mockUseAddresses.mockReturnValue([addresses]);
        mockUseUser.mockReturnValue([user]);
        mockGetAllSync.mockReturnValue(syncs);
        mockSelectSyncListLoadingState.mockReturnValue('success');
        mockUseFeature.mockReturnValue({ feature: { Value: true } as any, update: jest.fn() });

        renderHook(() => useShowBYOESpotlightModal());

        expect(openModalSpy).not.toHaveBeenCalled();
    });

    it('should not open the BYOE spotlight modal when user has some BYOE addresses', () => {
        const addresses = [internalAddress, enabledBYOEAddress];
        const user = { CreateTime: Math.floor(sub(new Date(), { months: 3 }).getTime() / 1000) };
        const syncs = [sync1];

        mockUseBYOEFeatureStatus.mockReturnValue(true);
        mockUseAddresses.mockReturnValue([addresses]);
        mockUseUser.mockReturnValue([user]);
        mockGetAllSync.mockReturnValue(syncs);
        mockSelectSyncListLoadingState.mockReturnValue('success');
        mockUseFeature.mockReturnValue({ feature: { Value: true } as any, update: jest.fn() });

        renderHook(() => useShowBYOESpotlightModal());

        expect(openModalSpy).not.toHaveBeenCalled();
    });

    it('should not open the BYOE spotlight modal when user has no access to BYOE', () => {
        const addresses = [internalAddress];
        const user = { CreateTime: Math.floor(sub(new Date(), { months: 3 }).getTime() / 1000) };
        const syncs = [sync1];

        mockUseBYOEFeatureStatus.mockReturnValue(false);
        mockUseAddresses.mockReturnValue([addresses]);
        mockUseUser.mockReturnValue([user]);
        mockGetAllSync.mockReturnValue(syncs);
        mockSelectSyncListLoadingState.mockReturnValue('success');
        mockUseFeature.mockReturnValue({ feature: { Value: true } as any, update: jest.fn() });

        renderHook(() => useShowBYOESpotlightModal());

        expect(openModalSpy).not.toHaveBeenCalled();
    });

    it('should not open the BYOE spotlight modal when modal has been seen already', () => {
        const addresses = [internalAddress];
        const user = { CreateTime: Math.floor(sub(new Date(), { months: 3 }).getTime() / 1000) };
        const syncs = [sync1];

        mockUseBYOEFeatureStatus.mockReturnValue(true);
        mockUseAddresses.mockReturnValue([addresses]);
        mockUseUser.mockReturnValue([user]);
        mockGetAllSync.mockReturnValue(syncs);
        mockSelectSyncListLoadingState.mockReturnValue('success');
        mockUseFeature.mockReturnValue({ feature: { Value: false } as any, update: jest.fn() });

        renderHook(() => useShowBYOESpotlightModal());

        expect(openModalSpy).not.toHaveBeenCalled();
    });
});
