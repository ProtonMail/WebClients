import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { BackgroundEffect } from '@proton/meet/store/slices/backgroundSlice';
import { backgroundReducer, initialState as initialBackgroundState } from '@proton/meet/store/slices/backgroundSlice';
import { deviceManagementReducer } from '@proton/meet/store/slices/deviceManagementSlice';
import { MeetingSideBars, uiStateReducer } from '@proton/meet/store/slices/uiStateSlice';
import { ProtonStoreContext } from '@proton/react-redux-store';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import { BackgroundEffectsContext } from '../../contexts/BackgroundEffects/BackgroundEffectsContext';
import { Backgrounds } from './Backgrounds';

// The preview attaches real camera tracks, which is covered by BackgroundPreview's own tests.
vi.mock('./BackgroundPreview', () => ({
    BackgroundPreview: () => <div data-testid="background-preview" />,
}));

const unleashMocks = vi.hoisted(() => ({ useFlag: vi.fn(() => true) }));
vi.mock('@proton/unleash/useFlag', () => unleashMocks);

const supportMocks = vi.hoisted(() => ({ supportsBackgroundEffects: vi.fn(() => true) }));
vi.mock('../../processors/background-processor/createBackgroundProcessor', () => supportMocks);

interface WrapperOptions {
    isSideBarOpen?: boolean;
    appliedBackgroundEffect?: BackgroundEffect;
    pendingBackgroundEffect?: BackgroundEffect | null;
    selectBackgroundEffect?: (effect: BackgroundEffect) => Promise<void>;
}

const Wrapper = ({
    children,
    isSideBarOpen = true,
    appliedBackgroundEffect = 'none',
    pendingBackgroundEffect = null,
    selectBackgroundEffect = () => Promise.resolve(),
}: WrapperOptions & { children: React.ReactNode }) => {
    const store = configureStore({
        // @ts-expect-error - mock data
        reducer: {
            ...uiStateReducer,
            ...deviceManagementReducer,
            ...backgroundReducer,
        },
        preloadedState: {
            deviceManagement: {
                activeCameraId: 'camera-1',
            },
            uiState: {
                sideBarState: {
                    [MeetingSideBars.Backgrounds]: isSideBarOpen,
                },
            },
            background: { ...initialBackgroundState, appliedBackgroundEffect, pendingBackgroundEffect },
        },
    });

    return (
        <Provider context={ProtonStoreContext} store={store}>
            <BackgroundEffectsContext.Provider
                // @ts-expect-error - only the picker's entry point is needed
                value={{ selectBackgroundEffect }}
            >
                {children}
            </BackgroundEffectsContext.Provider>
        </Provider>
    );
};

describe('Backgrounds', () => {
    afterEach(() => {
        unleashMocks.useFlag.mockReturnValue(true);
        supportMocks.supportsBackgroundEffects.mockReturnValue(true);
    });

    it('should not render when the side bar is closed', () => {
        const { container } = render(
            <Wrapper isSideBarOpen={false}>
                <Backgrounds />
            </Wrapper>
        );

        expect(screen.queryByRole('heading', { name: 'Backgrounds' })).not.toBeInTheDocument();
        // Mounting a thumbnail is what triggers its download, so a closed side bar must not put
        // any of them in the document.
        expect(container.querySelectorAll('img')).toHaveLength(0);
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
        expect(screen.getByRole('heading', { name: 'Blur and personal' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Virtual backgrounds' })).toBeInTheDocument();

        expect(screen.getByRole('radio', { name: 'No effect' })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: 'Blur background' })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: 'Office background' })).toBeInTheDocument();
    });

    it('should mark the no effect option as selected when nothing is applied', () => {
        render(
            <Wrapper appliedBackgroundEffect="none">
                <Backgrounds />
            </Wrapper>
        );

        expect(screen.getByRole('radio', { name: 'No effect' })).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByRole('radio', { name: 'Blur background' })).toHaveAttribute('aria-checked', 'false');
    });

    it('should mark the applied virtual background as selected', () => {
        render(
            <Wrapper appliedBackgroundEffect="office">
                <Backgrounds />
            </Wrapper>
        );

        expect(screen.getByRole('radio', { name: 'Office background' })).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByRole('radio', { name: 'No effect' })).toHaveAttribute('aria-checked', 'false');
    });

    it('should enable blur when picking the blur effect', async () => {
        const selectBackgroundEffect = vi.fn().mockResolvedValue(undefined);

        render(
            <Wrapper appliedBackgroundEffect="none" selectBackgroundEffect={selectBackgroundEffect}>
                <Backgrounds />
            </Wrapper>
        );

        await userEvent.setup().click(screen.getByRole('radio', { name: 'Blur background' }));

        expect(selectBackgroundEffect).toHaveBeenCalledWith('blur');
        // A click both focuses and activates the tile, and reinitialising the processor twice
        // over is expensive enough to be worth pinning down.
        expect(selectBackgroundEffect).toHaveBeenCalledTimes(1);
    });

    it('should apply the picked virtual background', async () => {
        const selectBackgroundEffect = vi.fn().mockResolvedValue(undefined);

        render(
            <Wrapper selectBackgroundEffect={selectBackgroundEffect}>
                <Backgrounds />
            </Wrapper>
        );

        await userEvent.setup().click(screen.getByRole('radio', { name: 'Mountain background' }));

        expect(selectBackgroundEffect).toHaveBeenCalledWith('mountain');
        expect(selectBackgroundEffect).toHaveBeenCalledTimes(1);
    });

    it('should ignore a click on the background already in use', async () => {
        const selectBackgroundEffect = vi.fn().mockResolvedValue(undefined);

        render(
            <Wrapper appliedBackgroundEffect="office" selectBackgroundEffect={selectBackgroundEffect}>
                <Backgrounds />
            </Wrapper>
        );

        await userEvent.setup().click(screen.getByRole('radio', { name: 'Office background' }));

        expect(selectBackgroundEffect).not.toHaveBeenCalled();
    });

    it('should show the image backgrounds with a lazily loaded thumbnail', () => {
        render(
            <Wrapper>
                <Backgrounds />
            </Wrapper>
        );

        const thumbnail = screen.getByRole('radio', { name: 'Office background' }).querySelector('img');

        expect(thumbnail).toBeInTheDocument();
        // The full-size image is only fetched once the background is picked, so the picker
        // must not pull every thumbnail in either.
        expect(thumbnail).toHaveAttribute('loading', 'lazy');
    });

    it('should clear the virtual background when picking no effect', async () => {
        const selectBackgroundEffect = vi.fn().mockResolvedValue(undefined);

        render(
            <Wrapper appliedBackgroundEffect="proton" selectBackgroundEffect={selectBackgroundEffect}>
                <Backgrounds />
            </Wrapper>
        );

        await userEvent.setup().click(screen.getByRole('radio', { name: 'No effect' }));

        expect(selectBackgroundEffect).toHaveBeenCalledWith('none');
    });

    it('should register every click while an effect is still being applied', async () => {
        const selectBackgroundEffect = vi.fn().mockResolvedValue(undefined);

        render(
            <Wrapper pendingBackgroundEffect="proton" selectBackgroundEffect={selectBackgroundEffect}>
                <Backgrounds />
            </Wrapper>
        );

        const user = userEvent.setup();
        await user.click(screen.getByRole('radio', { name: 'Office background' }));
        await user.click(screen.getByRole('radio', { name: 'Mountain background' }));

        expect(selectBackgroundEffect.mock.calls).toEqual([['office'], ['mountain']]);
    });

    it('should highlight the effect being applied before it lands on the track', () => {
        render(
            <Wrapper appliedBackgroundEffect="none" pendingBackgroundEffect="office">
                <Backgrounds />
            </Wrapper>
        );

        const officeOption = screen.getByRole('radio', { name: 'Office background' });
        expect(officeOption).toHaveAttribute('aria-checked', 'true');
        expect(officeOption).toHaveAttribute('aria-busy', 'true');
        expect(screen.getByRole('radio', { name: 'No effect' })).toHaveAttribute('aria-checked', 'false');
    });

    it('should keep showing the background being applied instead of a spinner', () => {
        render(
            <Wrapper appliedBackgroundEffect="none" pendingBackgroundEffect="blur">
                <Backgrounds />
            </Wrapper>
        );

        // Arrowing through the options applies each one in turn, so a per-tile spinner would flash
        // over the icons as focus moves. The preview carries the initializing state instead.
        const blurOption = screen.getByRole('radio', { name: 'Blur background' });
        expect(blurOption.querySelector('[data-testid="circle-loader"]')).not.toBeInTheDocument();
        expect(blurOption.querySelector('svg')).toBeInTheDocument();
    });

    it('should disable the options when background effects are not supported', async () => {
        supportMocks.supportsBackgroundEffects.mockReturnValue(false);
        const selectBackgroundEffect = vi.fn().mockResolvedValue(undefined);

        render(
            <Wrapper selectBackgroundEffect={selectBackgroundEffect}>
                <Backgrounds />
            </Wrapper>
        );

        const blurOption = screen.getByRole('radio', { name: 'Blur background' });

        // aria-disabled rather than the disabled attribute, so the tiles stay reachable and the
        // explanation below them can be announced.
        expect(blurOption).toHaveAttribute('aria-disabled', 'true');
        expect(screen.getByText('Background effects are not supported on your browser')).toBeInTheDocument();

        await userEvent.setup().click(blurOption);

        expect(selectBackgroundEffect).not.toHaveBeenCalled();
    });

    it('should describe the disabled options with the unsupported notice', () => {
        supportMocks.supportsBackgroundEffects.mockReturnValue(false);

        render(
            <Wrapper>
                <Backgrounds />
            </Wrapper>
        );

        const notice = screen.getByText('Background effects are not supported on your browser');

        expect(screen.getByRole('radiogroup', { name: 'Blur and personal' })).toHaveAttribute(
            'aria-describedby',
            notice.id
        );
    });

    describe('keyboard navigation', () => {
        it('should expose each section as a single tab stop landing on the current choice', () => {
            render(
                <Wrapper appliedBackgroundEffect="blur">
                    <Backgrounds />
                </Wrapper>
            );

            expect(screen.getByRole('radio', { name: 'Blur background' })).toHaveAttribute('tabindex', '0');
            expect(screen.getByRole('radio', { name: 'No effect' })).toHaveAttribute('tabindex', '-1');

            // The selection lives in the effects group, so the virtual backgrounds are entered at
            // their first option instead.
            expect(screen.getByRole('radio', { name: `${BRAND_NAME} background` })).toHaveAttribute('tabindex', '0');
            expect(screen.getByRole('radio', { name: 'Office background' })).toHaveAttribute('tabindex', '-1');
        });

        it('should not apply the background that tabbing lands on', async () => {
            const selectBackgroundEffect = vi.fn().mockResolvedValue(undefined);

            render(
                <Wrapper appliedBackgroundEffect="none" selectBackgroundEffect={selectBackgroundEffect}>
                    <Backgrounds />
                </Wrapper>
            );

            screen.getByRole('radio', { name: 'No effect' }).focus();
            await userEvent.setup().tab();

            // Moving between sections is not a choice yet, so entering the virtual backgrounds
            // must not swap the first one in behind the user's back.
            expect(screen.getByRole('radio', { name: `${BRAND_NAME} background` })).toHaveFocus();
            expect(selectBackgroundEffect).not.toHaveBeenCalled();
        });

        it('should apply the background the arrow keys move to', async () => {
            const selectBackgroundEffect = vi.fn().mockResolvedValue(undefined);

            render(
                <Wrapper appliedBackgroundEffect="none" selectBackgroundEffect={selectBackgroundEffect}>
                    <Backgrounds />
                </Wrapper>
            );

            const user = userEvent.setup();

            screen.getByRole('radio', { name: 'No effect' }).focus();
            await user.keyboard('{ArrowRight}');

            expect(screen.getByRole('radio', { name: 'Blur background' })).toHaveFocus();
            expect(selectBackgroundEffect).toHaveBeenCalledWith('blur');
        });

        it('should wrap around the ends of a section', async () => {
            const selectBackgroundEffect = vi.fn().mockResolvedValue(undefined);

            render(
                <Wrapper appliedBackgroundEffect="none" selectBackgroundEffect={selectBackgroundEffect}>
                    <Backgrounds />
                </Wrapper>
            );

            const user = userEvent.setup();

            screen.getByRole('radio', { name: 'No effect' }).focus();
            await user.keyboard('{ArrowLeft}');

            expect(screen.getByRole('radio', { name: 'Blur background' })).toHaveFocus();
            expect(selectBackgroundEffect).toHaveBeenCalledWith('blur');
        });

        it('should jump to the first and last background of a section', async () => {
            const selectBackgroundEffect = vi.fn().mockResolvedValue(undefined);

            render(
                <Wrapper selectBackgroundEffect={selectBackgroundEffect}>
                    <Backgrounds />
                </Wrapper>
            );

            const user = userEvent.setup();

            screen.getByRole('radio', { name: `${BRAND_NAME} background` }).focus();
            await user.keyboard('{End}');

            expect(screen.getByRole('radio', { name: 'Coffee place background' })).toHaveFocus();

            await user.keyboard('{Home}');

            expect(screen.getByRole('radio', { name: `${BRAND_NAME} background` })).toHaveFocus();
            expect(selectBackgroundEffect.mock.calls).toEqual([['coffee'], ['proton']]);
        });

        it('should not apply anything while the effects are unsupported', async () => {
            supportMocks.supportsBackgroundEffects.mockReturnValue(false);
            const selectBackgroundEffect = vi.fn().mockResolvedValue(undefined);

            render(
                <Wrapper selectBackgroundEffect={selectBackgroundEffect}>
                    <Backgrounds />
                </Wrapper>
            );

            screen.getByRole('radio', { name: 'No effect' }).focus();
            await userEvent.setup().keyboard('{ArrowRight}');

            expect(screen.getByRole('radio', { name: 'Blur background' })).toHaveFocus();
            expect(selectBackgroundEffect).not.toHaveBeenCalled();
        });
    });

    describe('preview', () => {
        it('should show a preview above the options', () => {
            render(
                <Wrapper>
                    <Backgrounds />
                </Wrapper>
            );

            expect(screen.getByTestId('background-preview')).toBeInTheDocument();
        });

        it('should show a preview when background effects are not supported', () => {
            supportMocks.supportsBackgroundEffects.mockReturnValue(false);

            render(
                <Wrapper>
                    <Backgrounds />
                </Wrapper>
            );

            expect(screen.getByTestId('background-preview')).toBeInTheDocument();
        });
    });
});
