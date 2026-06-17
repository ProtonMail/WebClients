import { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';

import { usePublicFolderStore } from './usePublicFolder.store';

describe('usePublicFolderStore layout', () => {
    beforeEach(() => {
        usePublicFolderStore.setState({ layout: LayoutSetting.List });
    });

    it('defaults to list layout', () => {
        expect(usePublicFolderStore.getState().layout).toBe(LayoutSetting.List);
    });

    it('switches to grid and back to list', () => {
        usePublicFolderStore.getState().setLayout(LayoutSetting.Grid);
        expect(usePublicFolderStore.getState().layout).toBe(LayoutSetting.Grid);

        usePublicFolderStore.getState().setLayout(LayoutSetting.List);
        expect(usePublicFolderStore.getState().layout).toBe(LayoutSetting.List);
    });
});
