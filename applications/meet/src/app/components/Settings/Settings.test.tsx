import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { MeetContextValues } from '../../contexts/MeetContext';
import { MeetContext } from '../../contexts/MeetContext';
import type { UIStateContextType } from '../../contexts/UIStateContext';
import { UIStateContext } from '../../contexts/UIStateContext';
import { MeetingSideBars } from '../../types';
import { Settings } from './Settings';

vi.mock('../../hooks/useLocalParticipantResolution', () => ({
    useLocalParticipantResolution: vi.fn().mockReturnValue({
        resolution: '1080p',
        handleResolutionChange: vi.fn(),
    }),
}));

const mockContextValues = {
    selfView: true,
    setSelfView: vi.fn(),
};

const mockUIStateContextValues = {
    sideBarState: {
        [MeetingSideBars.Settings]: true,
    },
};

const Wrapper = ({
    children,
    contextValue = {},
    uiStateContextValue = {},
}: {
    children: React.ReactNode;
    contextValue?: Partial<MeetContextValues>;
    uiStateContextValue?: Partial<UIStateContextType>;
}) => {
    return (
        // @ts-expect-error - contextValue is a partial MeetContextValues
        <MeetContext.Provider value={{ ...mockContextValues, ...contextValue }}>
            <UIStateContext.Provider
                // @ts-expect-error - mock data
                value={{ ...mockUIStateContextValues, ...uiStateContextValue }}
            >
                {children}
            </UIStateContext.Provider>
        </MeetContext.Provider>
    );
};

describe('Settings', () => {
    it('should have the correct title', () => {
        render(
            <Wrapper>
                <Settings />
            </Wrapper>
        );
        expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should have the correct options', () => {
        render(
            <Wrapper>
                <Settings />
            </Wrapper>
        );

        expect(screen.getByText('Dark Mode')).toBeInTheDocument();
        expect(screen.getByText('Hide self view')).toBeInTheDocument();
        expect(screen.getByText('Show meeting timer')).toBeInTheDocument();
        expect(screen.getByText('Desktop notifications')).toBeInTheDocument();
    });

    it('should allow for toggling the self view', async () => {
        const setSelfView = vi.fn();

        render(
            <Wrapper contextValue={{ setSelfView }}>
                <Settings />
            </Wrapper>
        );

        const user = userEvent.setup();

        const hideSelfViewCheckbox = screen.getByRole('checkbox', { name: 'Hide self view' });
        await user.click(hideSelfViewCheckbox);

        expect(setSelfView).toHaveBeenCalledWith(!mockContextValues.selfView);
    });
});
