import { act, renderHook } from '@testing-library/react-hooks';

import type { Share } from './interface';
import { ShareState, ShareType } from './interface';
import { useSharesStateProvider } from './useSharesState';

function createTestShare(
    shareId: string,
    volumeId: string,
    flags = {
        isLocked: false,
        isDefault: false,
        isVolumeSoftDeleted: false,
        type: ShareType.standard,
        state: ShareState.active,
    }
): Share {
    return {
        shareId,
        rootLinkId: 'linkId',
        volumeId,
        creator: 'creator',
        ...flags,
        possibleKeyPackets: [],
    };
}

describe('useSharesState', () => {
    let hook: {
        current: ReturnType<typeof useSharesStateProvider>;
    };

    const mainShare1 = createTestShare('mainShare1', 'volume1', {
        isLocked: true,
        isDefault: true,
        isVolumeSoftDeleted: false,
        type: ShareType.default,
        state: ShareState.active,
    });
    const device1 = createTestShare('device1', 'volume1', {
        isLocked: true,
        isDefault: false,
        isVolumeSoftDeleted: false,
        type: ShareType.device,
        state: ShareState.active,
    });
    const device2 = createTestShare('device2', 'volume1', {
        isLocked: true,
        isDefault: false,
        isVolumeSoftDeleted: false,
        type: ShareType.device,
        state: ShareState.active,
    });
    const share1 = createTestShare('share1', 'volume1', {
        isLocked: true,
        isDefault: false,
        isVolumeSoftDeleted: false,
        type: ShareType.standard,
        state: ShareState.active,
    });
    const mainShare2 = createTestShare('mainShare2', 'volume2', {
        isLocked: true,
        isDefault: true,
        isVolumeSoftDeleted: false,
        type: ShareType.default,
        state: ShareState.active,
    });
    const device3 = createTestShare('device3', 'volume2', {
        isLocked: true,
        isDefault: false,
        isVolumeSoftDeleted: false,
        type: ShareType.device,
        state: ShareState.active,
    });
    const share2 = createTestShare('share2', 'volume2', {
        isLocked: true,
        isDefault: false,
        isVolumeSoftDeleted: false,
        type: ShareType.standard,
        state: ShareState.active,
    });
    const mainShare3 = createTestShare('mainShare3', 'volume3', {
        isLocked: false,
        isDefault: true,
        isVolumeSoftDeleted: false,
        type: ShareType.default,
        state: ShareState.active,
    });
    const device4 = createTestShare('device4', 'volume3', {
        isLocked: false,
        isDefault: false,
        isVolumeSoftDeleted: false,
        type: ShareType.device,
        state: ShareState.active,
    });
    const mainShare4 = createTestShare('mainShare4', 'volume4', {
        isLocked: true,
        isDefault: true,
        isVolumeSoftDeleted: true,
        type: ShareType.default,
        state: ShareState.active,
    });
    const device5 = createTestShare('device5', 'volume4', {
        isLocked: true,
        isDefault: false,
        isVolumeSoftDeleted: true,
        type: ShareType.device,
        state: ShareState.active,
    });

    beforeEach(() => {
        jest.resetAllMocks();

        const { result } = renderHook(() => useSharesStateProvider());
        hook = result;

        act(() => {
            hook.current.setShares([
                mainShare1,
                device1,
                device2,
                share1,
                mainShare2,
                device3,
                share2,
                mainShare3,
                device4,
                mainShare4,
                device5,
            ]);
        });
    });

    it('returns only locked undeleted shares with its devices', async () => {
        const lockedShares = hook.current.getLockedShares();
        expect(lockedShares).toMatchObject([
            {
                defaultShare: mainShare1,
                devices: [device1, device2],
            },
            {
                defaultShare: mainShare2,
                devices: [device3],
            },
        ]);
    });
});
