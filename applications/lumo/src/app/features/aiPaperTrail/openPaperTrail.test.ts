import { assignUrl } from '@proton/shared/lib/helpers/location';

import { LUMO_ROUTES } from '../../entrypoint/lumoRoutes';
import { setNativeComposerVisibility } from '../../remote/nativeComposerBridgeHelpers';
import { openPaperTrail } from './openPaperTrail';

jest.mock('../../remote/nativeComposerBridgeHelpers');
jest.mock('@proton/shared/lib/helpers/location');

describe('openPaperTrail', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('navigates to the paper trail', () => {
        openPaperTrail();

        expect(assignUrl).toHaveBeenCalledWith(LUMO_ROUTES.AI_PAPER_TRAIL);
    });

    it('hides the native composer before the page reloads, so it cannot hover over the loading page', () => {
        openPaperTrail();

        expect(setNativeComposerVisibility).toHaveBeenCalledWith(false);
        const hideOrder = (setNativeComposerVisibility as jest.Mock).mock.invocationCallOrder[0];
        expect(hideOrder).toBeLessThan(jest.mocked(assignUrl).mock.invocationCallOrder[0]);
    });
});
