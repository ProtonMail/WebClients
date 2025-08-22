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
    disableVideos: false,
    setDisableVideos: vi.fn(),
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

        expect(screen.getByText('Stop incoming video')).toBeInTheDocument();
    });

    it('should allow for toggling the disable videos', async () => {
        const setDisableVideos = vi.fn();

        render(
            <Wrapper contextValue={{ setDisableVideos }}>
                <Settings />
            </Wrapper>
        );

        const user = userEvent.setup();

        const stopIncomingVideoCheckbox = screen.getByRole('checkbox', { name: 'Stop incoming video' });
        await user.click(stopIncomingVideoCheckbox);

        expect(setDisableVideos).toHaveBeenCalledWith(!mockContextValues.disableVideos);
    });
});
