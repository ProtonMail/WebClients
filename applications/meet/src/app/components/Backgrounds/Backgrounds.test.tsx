import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { deviceManagementReducer } from '@proton/meet/store/slices/deviceManagementSlice';
import { screenShareStatusReducer } from '@proton/meet/store/slices/screenShareStatusSlice';
import { settingsReducer } from '@proton/meet/store/slices/settings';
import { MeetingSideBars, uiStateReducer } from '@proton/meet/store/slices/uiStateSlice';
import { ProtonStoreContext } from '@proton/react-redux-store';

import type { MediaManagementContextType } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import { MediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import { Backgrounds } from './Backgrounds';

// The preview attaches real camera tracks, which is covered by BackgroundPreview's own tests.
vi.mock('./BackgroundPreview', () => ({
    BackgroundPreview: () => <div data-testid="background-preview" />,
}));

const unleashMocks = vi.hoisted(() => ({ useFlag: vi.fn(() => true) }));
vi.mock('@proton/unleash/useFlag', () => unleashMocks);

interface MockStoreOptions {
    isSideBarOpen?: boolean;
    isSelfViewEnabled?: boolean;
    isScreenShare?: boolean;
}

const createMockStore = ({ isSideBarOpen = true, isSelfViewEnabled = true, isScreenShare = false }: MockStoreOptions) =>
    configureStore({
        // @ts-expect-error - mock data
        reducer: {
            ...uiStateReducer,
            ...settingsReducer,
            ...screenShareStatusReducer,
            ...deviceManagementReducer,
        },
        preloadedState: {
            meetSettings: {
                selfView: isSelfViewEnabled,
            },
            screenShareStatus: {
                participantScreenSharingIdentity: isScreenShare ? 'someone-sharing' : null,
            },
            deviceManagement: {
                activeCameraId: 'camera-1',
            },
            uiState: {
                sideBarState: {
                    [MeetingSideBars.Backgrounds]: isSideBarOpen,
                },
            },
        },
    });

const Wrapper = ({
    children,
    contextValue = {},
    ...storeOptions
}: MockStoreOptions & {
    children: React.ReactNode;
    contextValue?: Partial<MediaManagementContextType>;
}) => {
    const store = createMockStore(storeOptions);

    return (
        <Provider context={ProtonStoreContext} store={store}>
            <MediaManagementContext.Provider
                // @ts-expect-error - contextValue is a partial MediaManagementContextType
                value={{
                    isBackgroundBlurSupported: true,
                    appliedBackgroundEffect: 'none',
                    isVideoEnabled: true,
                    ...contextValue,
                }}
            >
                {children}
            </MediaManagementContext.Provider>
        </Provider>
    );
};

describe('Backgrounds', () => {
    afterEach(() => {
        unleashMocks.useFlag.mockReturnValue(true);
    });

    it('should not render when the side bar is closed', () => {
        render(
            <Wrapper isSideBarOpen={false}>
                <Backgrounds />
            </Wrapper>
        );

        expect(screen.queryByRole('heading', { name: 'Backgrounds' })).not.toBeInTheDocument();
    });

    it('should not render when the feature is turned off', () => {
        unleashMocks.useFlag.mockReturnValue(false);

        render(
            <Wrapper>
                <Backgrounds />
            </Wrapper>
        );

        expect(screen.queryByRole('heading', { name: 'Backgrounds' })).not.toBeInTheDocument();
    });

    it('should show both sections with their options', () => {
        render(
            <Wrapper>
                <Backgrounds />
            </Wrapper>
        );

        expect(screen.getByRole('heading', { name: 'Backgrounds' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Background effects' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Virtual backgrounds' })).toBeInTheDocument();

        expect(screen.getByRole('option', { name: 'No effect' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Blur background' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Purple background' })).toBeInTheDocument();
    });

    it('should mark the no effect option as selected when nothing is applied', () => {
        render(
            <Wrapper contextValue={{ appliedBackgroundEffect: 'none' }}>
                <Backgrounds />
            </Wrapper>
        );

        expect(screen.getByRole('option', { name: 'No effect' })).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByRole('option', { name: 'Blur background' })).toHaveAttribute('aria-selected', 'false');
    });

    it('should mark the applied virtual background as selected', () => {
        render(
            <Wrapper contextValue={{ appliedBackgroundEffect: 'blue' }}>
                <Backgrounds />
            </Wrapper>
        );

        expect(screen.getByRole('option', { name: 'Blue background' })).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByRole('option', { name: 'No effect' })).toHaveAttribute('aria-selected', 'false');
    });

    it('should enable blur when picking the blur effect', async () => {
        const selectBackgroundEffect = vi.fn().mockResolvedValue(undefined);

        render(
            <Wrapper contextValue={{ appliedBackgroundEffect: 'none', selectBackgroundEffect }}>
                <Backgrounds />
            </Wrapper>
        );

        await userEvent.setup().click(screen.getByRole('option', { name: 'Blur background' }));

        expect(selectBackgroundEffect).toHaveBeenCalledWith('blur');
    });

    it('should apply the picked virtual background', async () => {
        const selectBackgroundEffect = vi.fn().mockResolvedValue(undefined);

        render(
            <Wrapper contextValue={{ selectBackgroundEffect }}>
                <Backgrounds />
            </Wrapper>
        );

        await userEvent.setup().click(screen.getByRole('option', { name: 'Green background' }));

        expect(selectBackgroundEffect).toHaveBeenCalledWith('green');
    });

    it('should clear the virtual background when picking no effect', async () => {
        const selectBackgroundEffect = vi.fn().mockResolvedValue(undefined);

        render(
            <Wrapper contextValue={{ appliedBackgroundEffect: 'purple', selectBackgroundEffect }}>
                <Backgrounds />
            </Wrapper>
        );

        await userEvent.setup().click(screen.getByRole('option', { name: 'No effect' }));

        expect(selectBackgroundEffect).toHaveBeenCalledWith('none');
    });

    it('should register every click while an effect is still being applied', async () => {
        const selectBackgroundEffect = vi.fn().mockResolvedValue(undefined);

        render(
            <Wrapper contextValue={{ pendingBackgroundEffect: 'purple', selectBackgroundEffect }}>
                <Backgrounds />
            </Wrapper>
        );

        const user = userEvent.setup();
        await user.click(screen.getByRole('option', { name: 'Blue background' }));
        await user.click(screen.getByRole('option', { name: 'Green background' }));

        expect(selectBackgroundEffect).toHaveBeenNthCalledWith(1, 'blue');
        expect(selectBackgroundEffect).toHaveBeenNthCalledWith(2, 'green');
    });

    it('should highlight the effect being applied before it lands on the track', () => {
        render(
            <Wrapper contextValue={{ appliedBackgroundEffect: 'none', pendingBackgroundEffect: 'blue' }}>
                <Backgrounds />
            </Wrapper>
        );

        const blueOption = screen.getByRole('option', { name: 'Blue background' });
        expect(blueOption).toHaveAttribute('aria-selected', 'true');
        expect(blueOption).toHaveAttribute('aria-busy', 'true');
        expect(screen.getByRole('option', { name: 'No effect' })).toHaveAttribute('aria-selected', 'false');
    });

    it('should disable the options when background effects are not supported', () => {
        render(
            <Wrapper contextValue={{ isBackgroundBlurSupported: false }}>
                <Backgrounds />
            </Wrapper>
        );

        expect(screen.getByRole('option', { name: 'Blur background' })).toBeDisabled();
        expect(screen.getByText('Background effects are not supported on your browser')).toBeInTheDocument();
    });

    describe('preview', () => {
        it('should not show a preview while the local tile is visible in the meeting', () => {
            render(
                <Wrapper contextValue={{ isVideoEnabled: true }}>
                    <Backgrounds />
                </Wrapper>
            );

            expect(screen.queryByTestId('background-preview')).not.toBeInTheDocument();
        });

        it('should show a preview when the camera is off in the meeting', () => {
            render(
                <Wrapper contextValue={{ isVideoEnabled: false }}>
                    <Backgrounds />
                </Wrapper>
            );

            expect(screen.getByTestId('background-preview')).toBeInTheDocument();
        });

        it('should show a preview when the self view is hidden', () => {
            render(
                <Wrapper isSelfViewEnabled={false} contextValue={{ isVideoEnabled: true }}>
                    <Backgrounds />
                </Wrapper>
            );

            expect(screen.getByTestId('background-preview')).toBeInTheDocument();
        });

        it('should show a preview while a screen share takes over the meeting', () => {
            render(
                <Wrapper isScreenShare={true} contextValue={{ isVideoEnabled: true }}>
                    <Backgrounds />
                </Wrapper>
            );

            expect(screen.getByTestId('background-preview')).toBeInTheDocument();
        });

        it('should not show a preview when background effects are not supported', () => {
            render(
                <Wrapper contextValue={{ isVideoEnabled: false, isBackgroundBlurSupported: false }}>
                    <Backgrounds />
                </Wrapper>
            );

            expect(screen.queryByTestId('background-preview')).not.toBeInTheDocument();
        });
    });
});
