import type { ReactNode } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';

import DrawerLumoView from './DrawerLumoView';
import type { LumoAgentDrawerValue } from './lumoAgentDrawerContext';
import LumoAgentDrawerContext from './lumoAgentDrawerContext';

vi.mock('@proton/components/components/drawer/views/DrawerView', () => ({
    default: ({ headerActions }: { headerActions: ReactNode }) => <>{headerActions}</>,
}));
vi.mock('@proton/components/containers/themes/ThemeProvider', () => ({
    useTheme: () => ({ information: { dark: false } }),
}));
vi.mock('@proton/components/hooks/drawer/useDrawer', () => ({
    default: () => ({ toggleDrawerApp: () => vi.fn() }),
}));

const renderView = (onDetach?: () => void) => {
    const drawer: LumoAgentDrawerValue = {
        items: [],
        isBusy: false,
        lastChainEnd: null,
        hasConversation: false,
        draft: '',
        setDraft: vi.fn(),
        send: vi.fn(),
        confirm: vi.fn(),
        cancel: vi.fn(),
        stop: vi.fn(),
        clear: vi.fn(),
        onDetach,
    };
    render(
        <LumoAgentDrawerContext.Provider value={drawer}>
            <DrawerLumoView />
        </LumoAgentDrawerContext.Provider>
    );
};

const detachButton = () => screen.queryByRole('button', { name: 'Detach' });

describe('DrawerLumoView', () => {
    it('detaches through the host before any conversation exists', () => {
        const onDetach = vi.fn();
        renderView(onDetach);

        fireEvent.click(detachButton()!);

        expect(onDetach).toHaveBeenCalledTimes(1);
    });

    it('offers no detach button to a host without a floating panel', () => {
        renderView();

        expect(detachButton()).toBeNull();
    });

    it('renders nothing while no conversation is published', () => {
        const { container } = render(<DrawerLumoView />);

        expect(container).toBeEmptyDOMElement();
    });
});
