import { fireEvent, render, screen } from '@testing-library/react';

import { useIsLumoSmallScreen } from '../hooks/useIsLumoSmallScreen';
import { RightPanelProvider, useRightPanel } from '../providers/RightPanelProvider';
import { LumoLayoutWithDrawer } from './LumoLayout';

jest.mock('../hooks/useIsLumoSmallScreen');
jest.mock('../components/Conversation/Header', () => ({ Header: () => null }));

// Like ProjectDetailView, subscribe to panel state and recreate drawer content on render.
const ProjectLayout = ({ revision }: { revision: number }) => {
    const panel = useRightPanel();
    return (
        <LumoLayoutWithDrawer drawer={{ defaultOpened: true, content: <div>{revision}</div> }}>
            <button onClick={panel.toggle}>Toggle panel</button>
            <output data-testid="panel-state">{String(panel.isOpen)}</output>
        </LumoLayoutWithDrawer>
    );
};

it.each([true, false])('preserves the user panel choice across rerenders (small screen: %s)', (isSmallScreen) => {
    jest.mocked(useIsLumoSmallScreen).mockReturnValue({ isSmallScreen, isMediumScreen: false });
    const view = (revision: number) => (
        <RightPanelProvider>
            <ProjectLayout revision={revision} />
        </RightPanelProvider>
    );
    const { rerender } = render(view(0));

    fireEvent.click(screen.getByRole('button', { name: 'Toggle panel' }));
    rerender(view(1));

    expect(screen.getByTestId('panel-state').textContent).toBe(String(isSmallScreen));
});
