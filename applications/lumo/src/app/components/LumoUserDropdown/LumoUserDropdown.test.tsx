import type ReactType from 'react';
import { useContext } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';

import { UserDropdownContext } from '@proton/components/containers/heading/UserDropdownContext';
import { APPS } from '@proton/shared/lib/constants';

import { setNativeComposerVisibility } from '../../remote/nativeComposerBridgeHelpers';
import LumoUserDropdown from './LumoUserDropdown';

vi.mock('../../remote/nativeComposerBridgeHelpers');
vi.mock('../../providers/SidebarProvider', () => ({
    useOptionalSidebar: () => ({ isVisible: true, isSmallScreen: false }),
}));
vi.mock('../../hooks/useIsLumoSmallScreen', () => ({ useIsLumoSmallScreen: () => ({ isSmallScreen: false }) }));
vi.mock('../../hooks/useLumoFlags', () => ({ useLumoFlags: () => ({ nativeComposer: true }) }));
vi.mock('../../util/userAgent', () => ({
    canUseNativeSidebarLayout: () => true,
    canShowWebComposer: (enabled: boolean) => !enabled,
}));
vi.mock('../../hooks/useLumoAuthAction', () => ({ useLumoAuthAction: () => ({ trigger: vi.fn() }) }));

// The dropdown's own chrome and the support modals come from @proton/components
// and need the full account context; none of it matters here.
vi.mock('@proton/components/containers/heading/useUserDropdownInfo', () => ({
    useUserDropdownInfo: () => ({
        APP_NAME: 'proton-lumo',
        user: {},
        info: {},
        upgrade: {},
        referral: {},
        accountSessions: {},
    }),
}));
vi.mock('@proton/components/containers/heading/UserDropdownButton', async () => {
    const { forwardRef } = await vi.importActual<typeof ReactType>('react');
    return { default: forwardRef(() => null) };
});
vi.mock('@proton/components/containers/support/AuthenticatedBugModal', () => ({
    default: function BugModal() {
        return <div>Report a problem</div>;
    },
}));
vi.mock('@proton/components/containers/support/HelpModal', () => ({
    default: function Help() {
        return null;
    },
}));
vi.mock('./LumoUserDropdownContent', () => ({
    default: function DropdownContent() {
        const { onOpenBugReportModal } = useContext(UserDropdownContext);
        return <button onClick={onOpenBugReportModal}>Report a problem trigger</button>;
    },
}));

describe('LumoUserDropdown', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('hides the native composer, which would otherwise cover the report modal', () => {
        render(<LumoUserDropdown app={APPS.PROTONLUMO} />);
        expect(setNativeComposerVisibility).not.toHaveBeenCalled();

        fireEvent.click(screen.getByText('Report a problem trigger'));

        expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(false);
    });
});
