import { screen } from '@testing-library/react';

import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';

import useActiveBreakpoint from '../../hooks/useActiveBreakpoint';
import { mockDefaultBreakpoints } from '../../testing/mockUseActiveBreakpoint';
import { renderWithProviders } from '../../testing/renderWithProviders';
import { AppSwitcher } from './AppSwitcher';

jest.mock('../../hooks/useActiveBreakpoint');
const mockUseActiveBreakpoint = useActiveBreakpoint as jest.MockedFunction<typeof useActiveBreakpoint>;

const mockViewport = (small: boolean) =>
    mockUseActiveBreakpoint.mockReturnValue({
        ...mockDefaultBreakpoints,
        viewportWidth: { ...mockDefaultBreakpoints.viewportWidth, '<=small': small },
    });

describe('AppSwitcher', () => {
    it('lists the available apps from the store, in order, on small viewports', () => {
        mockViewport(true);
        const availableApps = [APPS.PROTONMAIL, APPS.PROTONCALENDAR, APPS.PROTONDRIVE];

        renderWithProviders(<AppSwitcher app={APPS.PROTONMAIL} />, {
            preloadedState: { availableApps: availableApps },
        });

        expect(screen.getAllByRole('link').map((link) => link.getAttribute('title'))).toEqual(
            availableApps.map(getAppName)
        );
    });

    it('renders nothing with a single app', () => {
        mockViewport(true);

        const { container } = renderWithProviders(<AppSwitcher app={APPS.PROTONMAIL} />, {
            preloadedState: { availableApps: [APPS.PROTONMAIL] },
        });

        expect(container).toBeEmptyDOMElement();
    });

    it('renders nothing on larger viewports', () => {
        mockViewport(false);

        const { container } = renderWithProviders(<AppSwitcher app={APPS.PROTONMAIL} />, {
            preloadedState: { availableApps: [APPS.PROTONMAIL, APPS.PROTONDRIVE] },
        });

        expect(container).toBeEmptyDOMElement();
    });
});
