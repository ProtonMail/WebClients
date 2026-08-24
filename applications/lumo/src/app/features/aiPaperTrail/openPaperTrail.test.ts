import { LUMO_ROUTES } from '../../entrypoint/lumoRoutes';
import { setNativeComposerVisibility } from '../../remote/nativeComposerBridgeHelpers';
import { openPaperTrail } from './openPaperTrail';

jest.mock('../../remote/nativeComposerBridgeHelpers');

describe('openPaperTrail', () => {
    const assign = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        Object.defineProperty(window, 'location', {
            writable: true,
            value: { ...window.location, assign },
        });
    });

    it('navigates to the paper trail', () => {
        openPaperTrail();

        expect(assign).toHaveBeenCalledWith(LUMO_ROUTES.AI_PAPER_TRAIL);
    });

    it('hides the native composer before the page reloads, so it cannot hover over the loading page', () => {
        openPaperTrail();

        expect(setNativeComposerVisibility).toHaveBeenCalledWith(false);
        const hideOrder = (setNativeComposerVisibility as jest.Mock).mock.invocationCallOrder[0];
        expect(hideOrder).toBeLessThan(assign.mock.invocationCallOrder[0]);
    });
});
