import type { RenderResult } from '@testing-library/react-hooks';
import { renderHook } from '@testing-library/react-hooks';

import { useVolumesStateProvider } from './useVolumesState';

const VOLUME_ID_1 = 'volumeId-1';
const VOLUME_ID_2 = 'volumeId-2';

describe('useDriveEventManager', () => {
    let hook: RenderResult<ReturnType<typeof useVolumesStateProvider>>;

    const renderTestHook = () => {
        const { result } = renderHook(() => useVolumesStateProvider());
        return result;
    };

    beforeEach(() => {
        hook = renderTestHook();
    });

    afterEach(() => {
        hook.current.clear();
    });

    it('sets share ids by volumeId', async () => {
        const shareIds = ['1', '2', '3'];
        const idsInitial = hook.current.getVolumeShareIds(VOLUME_ID_1);
        expect(idsInitial).toEqual([]);

        hook.current.setVolumeShareIds(VOLUME_ID_1, shareIds);
        hook.current.setVolumeShareIds(VOLUME_ID_2, ['2']);

        expect(hook.current.getVolumeShareIds(VOLUME_ID_1)).toEqual(shareIds);
        expect(hook.current.getVolumeShareIds(VOLUME_ID_2)).toEqual(['2']);
    });

    it('finds volume id using share id', async () => {
        hook.current.setVolumeShareIds(VOLUME_ID_1, ['1']);
        hook.current.setVolumeShareIds(VOLUME_ID_2, ['2', '3']);

        expect(hook.current.findVolumeId('1')).toBe(VOLUME_ID_1);
        expect(hook.current.findVolumeId('2')).toBe(VOLUME_ID_2);
        expect(hook.current.findVolumeId('5')).toBe(undefined);
    });
});
