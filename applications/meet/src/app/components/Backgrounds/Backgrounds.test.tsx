import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { BackgroundEffect } from '@proton/meet/store/slices/backgroundSlice';
import { backgroundReducer, initialState as initialBackgroundState } from '@proton/meet/store/slices/backgroundSlice';
import type { CustomBackgroundsState } from '@proton/meet/store/slices/customBackgroundsSlice';
import {
    customBackgroundsReducer,
    initialState as initialCustomBackgroundsState,
    removeCustomBackground,
} from '@proton/meet/store/slices/customBackgroundsSlice';
import { deviceManagementReducer } from '@proton/meet/store/slices/deviceManagementSlice';
import { MeetingSideBars, uiStateReducer } from '@proton/meet/store/slices/uiStateSlice';
import { MAX_BACKGROUNDS_PER_NAMESPACE } from '@proton/meet/utils/customBackgrounds';
import { ProtonStoreContext } from '@proton/react-redux-store';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import { BackgroundEffectsContext } from '../../contexts/BackgroundEffects/BackgroundEffectsContext';
import { CustomBackgroundsContext } from '../../contexts/CustomBackgroundsContext';
import type { CustomBackgroundsActions } from '../../hooks/useCustomBackgrounds';
import { Backgrounds } from './Backgrounds';

// The preview attaches real camera tracks, which is covered by BackgroundPreview's own tests.
vi.mock('./BackgroundPreview', () => ({
    BackgroundPreview: () => <div data-testid="background-preview" />,
}));

const unleashMocks = vi.hoisted(() => ({ useFlag: vi.fn(() => true) }));
vi.mock('@proton/unleash/useFlag', () => unleashMocks);

const supportMocks = vi.hoisted(() => ({ supportsBackgroundEffects: vi.fn(() => true) }));
vi.mock('../../processors/background-processor/createBackgroundProcessor', () => supportMocks);

const customBackgroundsMocks = vi.hoisted(() => ({ useIsCustomBackgroundsEnabled: vi.fn(() => false) }));
vi.mock('../../hooks/useIsCustomBackgroundsEnabled', () => customBackgroundsMocks);

const noActions: CustomBackgroundsActions = {
    addBackground: () => Promise.resolve(),
    deleteBackground: () => Promise.resolve(),
    ensureLoaded: () => {},
};

interface StoreOptions {
    isSideBarOpen?: boolean;
    appliedBackgroundEffect?: BackgroundEffect;
    pendingBackgroundEffect?: BackgroundEffect | null;
    customBackgrounds?: Partial<CustomBackgroundsState>;
}

const createTestStore = ({
    isSideBarOpen = true,
    appliedBackgroundEffect = 'none',
    pendingBackgroundEffect = null,
    customBackgrounds,
}: StoreOptions = {}) =>
    configureStore({
        // @ts-expect-error - mock data
        reducer: {
            ...uiStateReducer,
            ...deviceManagementReducer,
            ...backgroundReducer,
            ...customBackgroundsReducer,
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
            customBackgrounds: { ...initialCustomBackgroundsState, ...customBackgrounds },
        },
    });

interface WrapperOptions extends StoreOptions {
    selectBackgroundEffect?: (effect: BackgroundEffect) => Promise<void>;
    customBackgroundActions?: Partial<CustomBackgroundsActions>;
    store?: ReturnType<typeof createTestStore>;
}

const Wrapper = ({
    children,
    selectBackgroundEffect = () => Promise.resolve(),
    customBackgroundActions,
    store,
    ...storeOptions
}: WrapperOptions & { children: React.ReactNode }) => (
    <Provider context={ProtonStoreContext} store={store ?? createTestStore(storeOptions)}>
        <BackgroundEffectsContext.Provider
            // @ts-expect-error - only the picker's entry point is needed
            value={{ selectBackgroundEffect }}
        >
            <CustomBackgroundsContext.Provider value={{ ...noActions, ...customBackgroundActions }}>
                {children}
            </CustomBackgroundsContext.Provider>
        </BackgroundEffectsContext.Provider>
    </Provider>
);

const picker = (options: WrapperOptions = {}) => (
    <Wrapper {...options}>
        <Backgrounds />
    </Wrapper>
);

const renderPicker = (options: WrapperOptions = {}) => {
    const selectBackgroundEffect = vi.fn().mockResolvedValue(undefined);

    return {
        ...render(picker({ selectBackgroundEffect, ...options })),
        user: userEvent.setup(),
        selectBackgroundEffect,
    };
};

describe('Backgrounds', () => {
    afterEach(() => {
        unleashMocks.useFlag.mockReturnValue(true);
        supportMocks.supportsBackgroundEffects.mockReturnValue(true);
        customBackgroundsMocks.useIsCustomBackgroundsEnabled.mockReturnValue(false);
    });

    it('should not render when the side bar is closed', () => {
        const { container } = renderPicker({ isSideBarOpen: false });

        expect(screen.queryByRole('heading', { name: 'Backgrounds' })).not.toBeInTheDocument();
        // Mounting a thumbnail is what triggers its download, so a closed side bar must not put
        // any of them in the document.
        expect(container.querySelectorAll('img')).toHaveLength(0);
    });

    it('should not render when the feature is turned off', () => {
        unleashMocks.useFlag.mockReturnValue(false);

        renderPicker();

        expect(screen.queryByRole('heading', { name: 'Backgrounds' })).not.toBeInTheDocument();
    });

    it('should show both sections with their options', () => {
        renderPicker();

        expect(screen.getByRole('heading', { name: 'Backgrounds' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Blur and personal' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Virtual backgrounds' })).toBeInTheDocument();

        expect(screen.getByRole('radio', { name: 'No effect' })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: 'Blur background' })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: 'Blurred office background' })).toBeInTheDocument();
    });

    it('should mark the no effect option as selected when nothing is applied', () => {
        renderPicker({ appliedBackgroundEffect: 'none' });

        expect(screen.getByRole('radio', { name: 'No effect' })).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByRole('radio', { name: 'Blur background' })).toHaveAttribute('aria-checked', 'false');
    });

    it('should mark the applied virtual background as selected', () => {
        renderPicker({ appliedBackgroundEffect: 'office' });

        expect(screen.getByRole('radio', { name: 'Blurred office background' })).toHaveAttribute(
            'aria-checked',
            'true'
        );
        expect(screen.getByRole('radio', { name: 'No effect' })).toHaveAttribute('aria-checked', 'false');
    });

    it('should enable blur when picking the blur effect', async () => {
        const { user, selectBackgroundEffect } = renderPicker({ appliedBackgroundEffect: 'none' });

        await user.click(screen.getByRole('radio', { name: 'Blur background' }));

        expect(selectBackgroundEffect).toHaveBeenCalledWith('blur');
        // A click both focuses and activates the tile, and reinitialising the processor twice
        // over is expensive enough to be worth pinning down.
        expect(selectBackgroundEffect).toHaveBeenCalledTimes(1);
    });

    it('should apply the picked virtual background', async () => {
        const { user, selectBackgroundEffect } = renderPicker();

        await user.click(screen.getByRole('radio', { name: 'Mountain landscape background' }));

        expect(selectBackgroundEffect).toHaveBeenCalledWith('mountain');
        expect(selectBackgroundEffect).toHaveBeenCalledTimes(1);
    });

    it('should ignore a click on the background already in use', async () => {
        const { user, selectBackgroundEffect } = renderPicker({ appliedBackgroundEffect: 'office' });

        await user.click(screen.getByRole('radio', { name: 'Blurred office background' }));

        expect(selectBackgroundEffect).not.toHaveBeenCalled();
    });

    it('should show the image backgrounds with a lazily loaded thumbnail', () => {
        renderPicker();

        const thumbnail = screen.getByRole('radio', { name: 'Blurred office background' }).querySelector('img');

        expect(thumbnail).toBeInTheDocument();
        // The full-size image is only fetched once the background is picked, so the picker
        // must not pull every thumbnail in either.
        expect(thumbnail).toHaveAttribute('loading', 'lazy');
    });

    it('should clear the virtual background when picking no effect', async () => {
        const { user, selectBackgroundEffect } = renderPicker({ appliedBackgroundEffect: 'protonDark' });

        await user.click(screen.getByRole('radio', { name: 'No effect' }));

        expect(selectBackgroundEffect).toHaveBeenCalledWith('none');
    });

    it('should register every click while an effect is still being applied', async () => {
        const { user, selectBackgroundEffect } = renderPicker({ pendingBackgroundEffect: 'protonDark' });

        await user.click(screen.getByRole('radio', { name: 'Blurred office background' }));
        await user.click(screen.getByRole('radio', { name: 'Mountain landscape background' }));

        expect(selectBackgroundEffect.mock.calls).toEqual([['office'], ['mountain']]);
    });

    it('should highlight the effect being applied before it lands on the track', () => {
        renderPicker({ appliedBackgroundEffect: 'none', pendingBackgroundEffect: 'office' });

        const officeOption = screen.getByRole('radio', { name: 'Blurred office background' });
        expect(officeOption).toHaveAttribute('aria-checked', 'true');
        expect(officeOption).toHaveAttribute('aria-busy', 'true');
        expect(screen.getByRole('radio', { name: 'No effect' })).toHaveAttribute('aria-checked', 'false');
    });

    it('should keep showing the background being applied instead of a spinner', () => {
        renderPicker({ appliedBackgroundEffect: 'none', pendingBackgroundEffect: 'blur' });

        // Arrowing through the options applies each one in turn, so a per-tile spinner would flash
        // over the icons as focus moves. The preview carries the initializing state instead.
        const blurOption = screen.getByRole('radio', { name: 'Blur background' });
        expect(blurOption.querySelector('[data-testid="circle-loader"]')).not.toBeInTheDocument();
        expect(blurOption.querySelector('svg')).toBeInTheDocument();
    });

    it('should disable the options when background effects are not supported', async () => {
        supportMocks.supportsBackgroundEffects.mockReturnValue(false);

        const { user, selectBackgroundEffect } = renderPicker();

        const blurOption = screen.getByRole('radio', { name: 'Blur background' });

        // aria-disabled rather than the disabled attribute, so the tiles stay reachable and the
        // explanation below them can be announced.
        expect(blurOption).toHaveAttribute('aria-disabled', 'true');
        expect(screen.getByText('Background effects are not supported on your browser')).toBeInTheDocument();

        await user.click(blurOption);

        expect(selectBackgroundEffect).not.toHaveBeenCalled();
    });

    it('should describe the disabled options with the unsupported notice', () => {
        supportMocks.supportsBackgroundEffects.mockReturnValue(false);

        renderPicker();

        const notice = screen.getByText('Background effects are not supported on your browser');

        expect(screen.getByRole('radiogroup', { name: 'Blur and personal' })).toHaveAttribute(
            'aria-describedby',
            notice.id
        );
    });

    describe('keyboard navigation', () => {
        it('should expose each section as a single tab stop landing on the current choice', () => {
            renderPicker({ appliedBackgroundEffect: 'blur' });

            expect(screen.getByRole('radio', { name: 'Blur background' })).toHaveAttribute('tabindex', '0');
            expect(screen.getByRole('radio', { name: 'No effect' })).toHaveAttribute('tabindex', '-1');

            // The selection lives in the effects group, so the virtual backgrounds are entered at
            // their first option instead.
            expect(screen.getByRole('radio', { name: `Dark ${BRAND_NAME} background` })).toHaveAttribute(
                'tabindex',
                '0'
            );
            expect(screen.getByRole('radio', { name: 'Blurred office background' })).toHaveAttribute('tabindex', '-1');
        });

        it('should not apply the background that tabbing lands on', async () => {
            const { user, selectBackgroundEffect } = renderPicker({ appliedBackgroundEffect: 'none' });

            screen.getByRole('radio', { name: 'No effect' }).focus();
            await user.tab();

            // Moving between sections is not a choice yet, so entering the virtual backgrounds
            // must not swap the first one in behind the user's back.
            expect(screen.getByRole('radio', { name: `Dark ${BRAND_NAME} background` })).toHaveFocus();
            expect(selectBackgroundEffect).not.toHaveBeenCalled();
        });

        // Blur sits after the no effect option, and before it once the ends of the section wrap.
        it.each([['{ArrowRight}'], ['{ArrowLeft}']])(
            'should apply the background %s moves the focus to',
            async (key) => {
                const { user, selectBackgroundEffect } = renderPicker({ appliedBackgroundEffect: 'none' });

                screen.getByRole('radio', { name: 'No effect' }).focus();
                await user.keyboard(key);

                expect(screen.getByRole('radio', { name: 'Blur background' })).toHaveFocus();
                expect(selectBackgroundEffect).toHaveBeenCalledWith('blur');
            }
        );

        it('should jump to the first and last background of a section', async () => {
            const { user, selectBackgroundEffect } = renderPicker();

            screen.getByRole('radio', { name: `Dark ${BRAND_NAME} background` }).focus();
            await user.keyboard('{End}');

            expect(screen.getByRole('radio', { name: 'Beach landscape background' })).toHaveFocus();

            await user.keyboard('{Home}');

            expect(screen.getByRole('radio', { name: `Dark ${BRAND_NAME} background` })).toHaveFocus();
            expect(selectBackgroundEffect.mock.calls).toEqual([['beach'], ['protonDark']]);
        });

        it('should not apply anything while the effects are unsupported', async () => {
            supportMocks.supportsBackgroundEffects.mockReturnValue(false);

            const { user, selectBackgroundEffect } = renderPicker();

            screen.getByRole('radio', { name: 'No effect' }).focus();
            await user.keyboard('{ArrowRight}');

            expect(screen.getByRole('radio', { name: 'Blur background' })).toHaveFocus();
            expect(selectBackgroundEffect).not.toHaveBeenCalled();
        });
    });

    describe('custom backgrounds', () => {
        beforeEach(() => {
            customBackgroundsMocks.useIsCustomBackgroundsEnabled.mockReturnValue(true);
        });

        const twoBackgrounds = [
            { id: 'node-1', name: 'beach.png', createdAt: 0, isLoading: false },
            { id: 'node-2', name: 'forest.png', createdAt: 1, isLoading: false },
        ];

        const oneBackground = twoBackgrounds.slice(0, 1);

        const addingBackground = {
            isAddingBackground: true,
            backgrounds: [{ id: 'pending.1', name: 'beach.png', createdAt: 0, isLoading: true }],
        };

        const atBackgroundLimit = Array.from({ length: MAX_BACKGROUNDS_PER_NAMESPACE }, (_, index) => ({
            id: `node-${index}`,
            name: `background-${index}.png`,
            createdAt: index,
            isLoading: false,
        }));

        const renderWithBackgrounds = (
            customBackgrounds: Partial<CustomBackgroundsState>,
            options: WrapperOptions = {}
        ) => renderPicker({ ...options, customBackgrounds });

        it('should tell a background that is still being added apart from one that has landed', () => {
            renderWithBackgrounds({
                ...addingBackground,
                backgrounds: [...addingBackground.backgrounds, ...twoBackgrounds.slice(1)],
            });

            expect(screen.getByRole('radio', { name: 'Adding beach.png' })).toHaveAttribute('aria-busy', 'true');
            expect(screen.getByRole('radio', { name: 'forest.png' })).toHaveAttribute('aria-busy', 'false');
        });

        it('should not let a background that is still being added be picked or removed', async () => {
            const { user, selectBackgroundEffect } = renderWithBackgrounds(addingBackground);

            // Its id is local until the upload lands, so there is nothing to apply or trash yet.
            await user.click(screen.getByRole('radio', { name: 'Adding beach.png' }));

            expect(selectBackgroundEffect).not.toHaveBeenCalled();
            expect(screen.queryByRole('button', { name: /^Remove/ })).not.toBeInTheDocument();
        });

        it('should only ask for the backgrounds once the side bar is open', () => {
            const ensureLoaded = vi.fn();
            const customBackgroundActions = { ensureLoaded };

            const { rerender } = renderPicker({ isSideBarOpen: false, customBackgroundActions });

            // Fetching them is a Drive round trip, which joining a meeting must not pay for.
            expect(ensureLoaded).not.toHaveBeenCalled();

            rerender(picker({ customBackgroundActions }));

            expect(ensureLoaded).toHaveBeenCalledTimes(1);
        });

        it('should reach the add button with the arrow keys without applying anything', async () => {
            const { user, selectBackgroundEffect } = renderWithBackgrounds({}, { appliedBackgroundEffect: 'blur' });

            screen.getByRole('radio', { name: 'Blur background' }).focus();
            await user.keyboard('{ArrowRight}');

            expect(screen.getByRole('button', { name: 'Add your own background' })).toHaveFocus();
            // The add button is not a background, so arrowing onto it swaps nothing in.
            expect(selectBackgroundEffect).not.toHaveBeenCalled();
        });

        it('should keep the add button out of the tab order', () => {
            renderWithBackgrounds({}, { appliedBackgroundEffect: 'blur' });

            // The section stays a single tab stop, so the add button is only reachable by arrowing.
            expect(screen.getByRole('button', { name: 'Add your own background' })).toHaveAttribute('tabindex', '-1');
        });

        it('should carry on past the add button to the backgrounds after it', async () => {
            const { user, selectBackgroundEffect } = renderWithBackgrounds(
                { backgrounds: oneBackground },
                { appliedBackgroundEffect: 'blur' }
            );

            screen.getByRole('button', { name: 'Add your own background' }).focus();
            await user.keyboard('{ArrowRight}');

            expect(screen.getByRole('radio', { name: 'beach.png' })).toHaveFocus();
            expect(selectBackgroundEffect).toHaveBeenCalledWith('custom:node-1');
        });

        it('should name each remove button after the background it removes', () => {
            renderWithBackgrounds({ backgrounds: twoBackgrounds });

            // A group can hold several of these, and "Remove background" on each would leave a
            // screen reader user unable to tell them apart.
            expect(screen.getByRole('button', { name: 'Remove beach.png' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Remove forest.png' })).toBeInTheDocument();
        });

        it('should keep the remove button out of the tab order and offer the Delete key instead', () => {
            renderWithBackgrounds({ backgrounds: oneBackground });

            // The section stays a single tab stop, so removal hangs off the tile rather than
            // adding a tab stop per background.
            expect(screen.getByRole('button', { name: 'Remove beach.png' })).toHaveAttribute('tabindex', '-1');
            expect(screen.getByRole('radio', { name: 'beach.png' })).toHaveAttribute('aria-keyshortcuts', 'Delete');
        });

        it('should remove the focused background with the Delete key', async () => {
            const deleteBackground = vi.fn().mockResolvedValue(undefined);

            const { user } = renderWithBackgrounds(
                { backgrounds: twoBackgrounds },
                { customBackgroundActions: { deleteBackground } }
            );

            screen.getByRole('radio', { name: 'forest.png' }).focus();
            await user.keyboard('{Delete}');

            expect(deleteBackground).toHaveBeenCalledWith('node-2');
        });

        it('should not offer the Delete key on a background that cannot be removed', async () => {
            const deleteBackground = vi.fn().mockResolvedValue(undefined);

            const { user } = renderWithBackgrounds(addingBackground, {
                customBackgroundActions: { deleteBackground },
            });

            const option = screen.getByRole('radio', { name: 'Adding beach.png' });
            option.focus();
            await user.keyboard('{Delete}');

            expect(option).not.toHaveAttribute('aria-keyshortcuts');
            expect(deleteBackground).not.toHaveBeenCalled();
        });

        it('should move focus to the next background once one is removed', async () => {
            const store = createTestStore({ customBackgrounds: { backgrounds: twoBackgrounds } });

            render(
                picker({
                    store,
                    customBackgroundActions: {
                        deleteBackground: async (recordId) => {
                            store.dispatch(removeCustomBackground(recordId));
                        },
                    },
                })
            );

            screen.getByRole('radio', { name: 'beach.png' }).focus();
            await userEvent.setup().keyboard('{Delete}');

            expect(screen.queryByRole('radio', { name: 'beach.png' })).not.toBeInTheDocument();
            // Its tile is gone, so without this focus would fall to the body and drop the user
            // out of the picker entirely.
            expect(screen.getByRole('radio', { name: 'forest.png' })).toHaveFocus();
        });

        it('should leave focus alone when a background could not be removed', async () => {
            const { user } = renderWithBackgrounds(
                { backgrounds: twoBackgrounds },
                { customBackgroundActions: { deleteBackground: () => Promise.reject(new Error('offline')) } }
            );

            const option = screen.getByRole('radio', { name: 'beach.png' });

            option.focus();
            await user.keyboard('{Delete}');

            // The background is still there, and moving focus off it would tell the user otherwise.
            expect(option).toHaveFocus();
        });

        it('should explain why the add button is off once the limit is reached', () => {
            renderWithBackgrounds({ backgrounds: atBackgroundLimit });

            const addButton = screen.getByRole('button', { name: 'Add your own background' });

            // Dimming it says nothing to anyone who cannot see it, and the limit error never fires
            // because the disabled button swallows the click.
            expect(addButton).toHaveAttribute('aria-disabled', 'true');
            expect(addButton).toHaveAccessibleDescription('You can save up to 20 of your own backgrounds.');
        });

        it('should explain why the add button is off while the backgrounds could not be listed', () => {
            renderWithBackgrounds({ isDriveUnavailable: true });

            const addButton = screen.getByRole('button', { name: 'Add your own background' });

            // Uploading against a folder we could not read would put a background where neither the
            // limit nor the reconciliation can see it.
            expect(addButton).toHaveAttribute('aria-disabled', 'true');
            expect(addButton).toHaveAccessibleDescription(
                'Your backgrounds could not be loaded, so a new one cannot be added right now.'
            );
        });

        it('should show the name of a background that has no thumbnail', () => {
            renderWithBackgrounds({ backgrounds: oneBackground });

            // Thumbnail generation can be skipped at upload, and the background still applies, so
            // an empty square would leave the user nothing to pick by.
            const option = screen.getByRole('radio', { name: 'beach.png' });

            expect(option.querySelector('img')).not.toBeInTheDocument();
            expect(option).toHaveTextContent('beach.png');
        });

        it('should not describe the add button while backgrounds can still be added', () => {
            renderWithBackgrounds({});

            expect(screen.getByRole('button', { name: 'Add your own background' })).not.toHaveAttribute(
                'aria-describedby'
            );
            expect(screen.queryByText(/You can save up to/)).not.toBeInTheDocument();
        });
    });

    describe('preview', () => {
        it.each([[true], [false]])('should show a preview above the options, supported: %s', (isSupported) => {
            supportMocks.supportsBackgroundEffects.mockReturnValue(isSupported);

            renderPicker();

            expect(screen.getByTestId('background-preview')).toBeInTheDocument();
        });
    });
});
