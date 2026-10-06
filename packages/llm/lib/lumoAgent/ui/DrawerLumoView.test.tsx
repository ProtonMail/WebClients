import type { ReactNode } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';

import DrawerLumoView from './DrawerLumoView';
import type { LumoAgentDrawerValue } from './lumoAgentDrawerContext';
import LumoAgentDrawerContext from './lumoAgentDrawerContext';

jest.mock('@proton/components/components/drawer/views/DrawerView', () => ({
    __esModule: true,
    default: ({ headerActions }: { headerActions: ReactNode }) => <>{headerActions}</>,
}));
jest.mock('@proton/components/containers/themes/ThemeProvider', () => ({
    useTheme: () => ({ information: { dark: false } }),
}));
jest.mock('@proton/components/hooks/drawer/useDrawer', () => ({
    __esModule: true,
    default: () => ({ toggleDrawerApp: () => jest.fn() }),
}));

const renderView = (onDetach?: () => void) => {
    const drawer: LumoAgentDrawerValue = {
        items: [],
        isBusy: false,
        hasConversation: false,
        draft: '',
        setDraft: jest.fn(),
        send: jest.fn(),
        confirm: jest.fn(),
        cancel: jest.fn(),
        stop: jest.fn(),
        clear: jest.fn(),
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
        const onDetach = jest.fn();
        renderView(onDetach);

        fireEvent.click(detachButton()!);

        expect(onDetach).toHaveBeenCalledTimes(1);
    });

    it('offers no detach button to a host without a floating panel', () => {
        renderView();

        expect(detachButton()).toBeNull();
    });
});
