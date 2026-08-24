import { render } from '@testing-library/react';

import { setNativeComposerVisibility } from '../../remote/nativeComposerBridgeHelpers';
import { AiPaperTrailView } from './AiPaperTrailView';

jest.mock('../../remote/nativeComposerBridgeHelpers');
// The page renders outside the sidebar layout, which is the case the visibility hook has to cope
// with: no provider, so no sidebar competing for the screen.
jest.mock('../../providers/SidebarProvider', () => ({ useOptionalSidebar: () => null }));
jest.mock('../../hooks/useIsLumoSmallScreen', () => ({ useIsLumoSmallScreen: () => ({ isSmallScreen: true }) }));
jest.mock('../../hooks/useLumoFlags', () => ({ useLumoFlags: () => ({ nativeComposer: true }) }));
jest.mock('../../redux/hooks', () => ({
    useLumoDispatch: () => jest.fn(),
    useLumoSelector: () => undefined,
    useLumoMemoSelector: () => ({}),
}));
jest.mock('./useStartPaperTrail', () => ({
    useStartPaperTrail: () => ({ status: 'idle', start: jest.fn(), reset: jest.fn() }),
}));
jest.mock('../../hooks/useLumoNavigate', () => ({ useLumoNavigate: () => jest.fn() }));
// The stages pull in @proton/components and the markdown renderer; none of that
// is needed to observe what this page tells the native shell on mount.
jest.mock('./PaperTrailHeader', () => ({ PaperTrailHeader: () => null }));
jest.mock('./PaperTrailLightThemeScope', () => ({
    PaperTrailLightThemeScope: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('./PaperTrailLowProfileView', () => ({ PaperTrailLowProfileView: () => null }));
jest.mock('./PaperTrailReportView', () => ({ PaperTrailReportView: () => null }));
jest.mock('./landing/LandingStage', () => ({ LandingStage: () => null }));
jest.mock('./loading/LoadingStage', () => ({ LoadingStage: () => null }));
jest.mock('./wizard/InstructionsStage', () => ({ InstructionsStage: () => null }));
jest.mock('./wizard/UploadStage', () => ({ UploadStage: () => null }));

describe('AiPaperTrailView', () => {
    it('hides the native composer, which would otherwise float over the page', () => {
        render(<AiPaperTrailView />);

        expect(setNativeComposerVisibility).toHaveBeenCalledWith(false);
    });
});
