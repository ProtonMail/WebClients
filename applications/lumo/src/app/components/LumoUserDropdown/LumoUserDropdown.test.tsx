import { fireEvent, render, screen } from '@testing-library/react';

import { APPS } from '@proton/shared/lib/constants';

import { setNativeComposerVisibility } from '../../remote/nativeComposerBridgeHelpers';
import LumoUserDropdown from './LumoUserDropdown';

jest.mock('../../remote/nativeComposerBridgeHelpers');
jest.mock('../../providers/SidebarProvider', () => ({
    useOptionalSidebar: () => ({ isVisible: true, isSmallScreen: false }),
}));
jest.mock('../../hooks/useIsLumoSmallScreen', () => ({ useIsLumoSmallScreen: () => ({ isSmallScreen: false }) }));
jest.mock('../../hooks/useLumoFlags', () => ({ useLumoFlags: () => ({ nativeComposer: true }) }));
jest.mock('../../util/userAgent', () => ({ canUseNativeSidebarLayout: () => true }));
jest.mock('../../hooks/useLumoAuthAction', () => ({ useLumoAuthAction: () => ({ trigger: jest.fn() }) }));

// The dropdown's own chrome and the support modals come from @proton/components
// and need the full account context; none of it matters here.
jest.mock('@proton/components/containers/heading/useUserDropdownInfo', () => ({
    useUserDropdownInfo: () => ({
        APP_NAME: 'proton-lumo',
        user: {},
        info: {},
        upgrade: {},
        referral: {},
        accountSessions: {},
    }),
}));
jest.mock('@proton/components/containers/heading/UserDropdownButton', () => require('react').forwardRef(() => null));
jest.mock(
    '@proton/components/containers/support/AuthenticatedBugModal',
    () =>
        function BugModal() {
            return <div>Report a problem</div>;
        }
);
jest.mock(
    '@proton/components/containers/support/HelpModal',
    () =>
        function Help() {
            return null;
        }
);
jest.mock(
    './LumoUserDropdownContent',
    () =>
        function DropdownContent() {
            const { useContext } = require('react');
            const { UserDropdownContext } = require('@proton/components/containers/heading/UserDropdownContext');
            const { onOpenBugReportModal } = useContext(UserDropdownContext);
            return <button onClick={onOpenBugReportModal}>Report a problem trigger</button>;
        }
);

describe('LumoUserDropdown', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('hides the native composer, which would otherwise cover the report modal', () => {
        render(<LumoUserDropdown app={APPS.PROTONLUMO} />);
        expect(setNativeComposerVisibility).not.toHaveBeenCalled();

        fireEvent.click(screen.getByText('Report a problem trigger'));

        expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(false);
    });
});
