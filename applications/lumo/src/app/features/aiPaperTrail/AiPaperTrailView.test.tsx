import { render } from '@testing-library/react';

import { setNativeComposerVisibility } from '../../remote/nativeComposerBridgeHelpers';
import { AiPaperTrailView } from './AiPaperTrailView';

vi.mock('../../remote/nativeComposerBridgeHelpers');
// The page renders outside the sidebar layout, which is the case the visibility hook has to cope
// with: no provider, so no sidebar competing for the screen.
vi.mock('../../providers/SidebarProvider', () => ({ useOptionalSidebar: () => null }));
vi.mock('../../hooks/useIsLumoSmallScreen', () => ({ useIsLumoSmallScreen: () => ({ isSmallScreen: true }) }));
vi.mock('../../hooks/useLumoFlags', () => ({ useLumoFlags: () => ({ nativeComposer: true }) }));
vi.mock('../../redux/hooks', () => ({
    useLumoDispatch: () => vi.fn(),
    useLumoSelector: () => undefined,
    useLumoMemoSelector: () => ({}),
}));
vi.mock('./useStartPaperTrail', () => ({
    useStartPaperTrail: () => ({ status: 'idle', start: vi.fn(), reset: vi.fn() }),
}));
vi.mock('../../hooks/useLumoNavigate', () => ({ useLumoNavigate: () => vi.fn() }));
// The stages pull in @proton/components and the markdown renderer; none of that
// is needed to observe what this page tells the native shell on mount.
vi.mock('./PaperTrailHeader', () => ({ PaperTrailHeader: () => null }));
vi.mock('./PaperTrailLightThemeScope', () => ({
    PaperTrailLightThemeScope: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('./PaperTrailLowProfileView', () => ({ PaperTrailLowProfileView: () => null }));
vi.mock('./PaperTrailReportView', () => ({ PaperTrailReportView: () => null }));
vi.mock('./landing/LandingStage', () => ({ LandingStage: () => null }));
vi.mock('./loading/LoadingStage', () => ({ LoadingStage: () => null }));
vi.mock('./wizard/InstructionsStage', () => ({ InstructionsStage: () => null }));
vi.mock('./wizard/UploadStage', () => ({ UploadStage: () => null }));

describe('AiPaperTrailView', () => {
    it('hides the native composer, which would otherwise float over the page', () => {
        render(<AiPaperTrailView />);

        expect(setNativeComposerVisibility).toHaveBeenCalledWith(false);
    });
});
