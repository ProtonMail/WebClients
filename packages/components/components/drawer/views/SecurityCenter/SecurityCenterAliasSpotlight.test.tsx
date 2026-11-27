import { fireEvent, render, screen } from '@testing-library/react';
import type { MockedFunction } from 'vitest';

import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';

import useDrawer from '../../../../hooks/drawer/useDrawer';
import useActiveBreakpoint from '../../../../hooks/useActiveBreakpoint';
import { mockDefaultBreakpoints } from '../../../../testing/mockUseActiveBreakpoint';
import SpotlightProvider from '../../../spotlight/Provider';
import useSpotlightShow from '../../../spotlight/useSpotlightShow';
import SecurityCenterAliasSpotlight from './SecurityCenterAliasSpotlight';

vi.mock('../../../../hooks/drawer/useDrawer', () => ({
    __esModule: true,
    default: vi.fn(),
}));
vi.mock('../../../../hooks/useActiveBreakpoint');

const mockUseDrawer = useDrawer as unknown as MockedFunction<() => Partial<ReturnType<typeof useDrawer>>>;
const mockUseActiveBreakpoint = useActiveBreakpoint as MockedFunction<typeof useActiveBreakpoint>;

const openDrawerApp = vi.fn();
const toggleDrawerApp = vi.fn(() => openDrawerApp);

const setup = ({ appInView = undefined as string | undefined, small = false } = {}) => {
    mockUseDrawer.mockReturnValue({ toggleDrawerApp, appInView } as Partial<ReturnType<typeof useDrawer>>);
    mockUseActiveBreakpoint.mockReturnValue({
        ...mockDefaultBreakpoints,
        viewportWidth: { ...mockDefaultBreakpoints.viewportWidth, '<=small': small },
    });
};

const renderSpotlight = (show: boolean, onClose = vi.fn(), onDisplayed = vi.fn()) => {
    const result = render(
        <SecurityCenterAliasSpotlight show={show} onClose={onClose} onDisplayed={onDisplayed}>
            <button type="button">Security center</button>
        </SecurityCenterAliasSpotlight>
    );
    return { ...result, onClose, onDisplayed };
};

const getCreateAliasLink = () => screen.getByRole('button', { name: 'Create an alias' });

describe('SecurityCenterAliasSpotlight', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setup();
    });

    it('shows the title, text, star illustration and Create an alias link when shown', () => {
        renderSpotlight(true);

        const inner = screen.getByTestId('spotlight-inner');
        expect(inner.querySelector('img')).not.toBeNull();
        expect(screen.getByText('Signing up for something new?')).toHaveClass('text-bold');
        expect(
            screen.getByText(
                'Use a Proton Mail alias instead of your real address. Newsletters still reach you, and you can turn the alias off anytime.'
            )
        ).toBeInTheDocument();
        expect(getCreateAliasLink()).toBeInTheDocument();
    });

    it('still shows when another spotlight has already appeared in this visit', async () => {
        const OtherSpotlight = () => {
            const shown = useSpotlightShow(true);
            return shown ? <span>Other spotlight</span> : null;
        };

        render(
            <SpotlightProvider>
                <OtherSpotlight />
                <SecurityCenterAliasSpotlight show onClose={vi.fn()}>
                    <button type="button">Security center</button>
                </SecurityCenterAliasSpotlight>
            </SpotlightProvider>
        );

        expect(await screen.findByText('Other spotlight')).toBeInTheDocument();
        expect(getCreateAliasLink()).toBeInTheDocument();
    });

    it('reports once that it has shown', () => {
        const { onDisplayed } = renderSpotlight(true);

        expect(onDisplayed).toHaveBeenCalledTimes(1);
    });

    it("doesn't report it when not shown, including on small screens", () => {
        const { onDisplayed } = renderSpotlight(false);
        expect(onDisplayed).not.toHaveBeenCalled();

        setup({ small: true });
        const { onDisplayed: onDisplayedSmall } = renderSpotlight(true);
        expect(onDisplayedSmall).not.toHaveBeenCalled();
    });

    it('shows nothing on small screens', () => {
        setup({ small: true });

        renderSpotlight(true);

        expect(screen.queryByTestId('spotlight-inner')).not.toBeInTheDocument();
    });

    it('Create an alias opens Security center and closes the spotlight', () => {
        const { onClose } = renderSpotlight(true);

        fireEvent.click(getCreateAliasLink());

        expect(toggleDrawerApp).toHaveBeenCalledWith({ app: DRAWER_NATIVE_APPS.SECURITY_CENTER });
        expect(openDrawerApp).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('Create an alias leaves Security center open when it already is', () => {
        setup({ appInView: DRAWER_NATIVE_APPS.SECURITY_CENTER });
        const { onClose } = renderSpotlight(true);

        fireEvent.click(getCreateAliasLink());

        expect(openDrawerApp).not.toHaveBeenCalled();
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('the close button closes it without opening Security center', () => {
        const { onClose } = renderSpotlight(true);

        fireEvent.click(screen.getByTestId('spotlight-inner-close-button'));

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(openDrawerApp).not.toHaveBeenCalled();
    });

    it('clicking the button it points at closes it', () => {
        const { onClose } = renderSpotlight(true);

        fireEvent.click(screen.getByRole('button', { name: 'Security center' }));

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('clears the request when unmounted while showing', () => {
        const { onClose, unmount } = renderSpotlight(true);

        unmount();

        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
