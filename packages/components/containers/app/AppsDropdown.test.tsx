import { fireEvent, screen } from '@testing-library/react';

import { unauthenticatedApps } from '@proton/account/availableApps/apps';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';

import { renderWithProviders } from '../../testing/renderWithProviders';
import AppsDropdown, { UnAuthenticatedAppsDropdown } from './AppsDropdown';

const openDropdown = () => fireEvent.click(screen.getByTitle('Proton applications'));

const getListedApps = () =>
    screen.getAllByTestId('apps-dropdown-item').map((item) => item.querySelector('a')?.getAttribute('title'));

const getAppNames = (apps: APP_NAMES[]) => apps.map(getAppName);

describe('UnAuthenticatedAppsDropdown', () => {
    it('lists the hardcoded apps, in order', () => {
        renderWithProviders(<UnAuthenticatedAppsDropdown app={APPS.PROTONMEET} />);

        openDropdown();

        expect(getListedApps()).toEqual(getAppNames(unauthenticatedApps));
    });

    it('ignores the available apps from the store', () => {
        renderWithProviders(<UnAuthenticatedAppsDropdown app={APPS.PROTONMEET} />, {
            preloadedState: { availableApps: [APPS.PROTONMAIL, APPS.PROTONDRIVE] },
        });

        openDropdown();

        expect(getListedApps()).toEqual(getAppNames(unauthenticatedApps));
    });
});

describe('AppsDropdown', () => {
    it('lists the available apps from the store, in order', () => {
        const availableApps = [APPS.PROTONMAIL, APPS.PROTONDRIVE, APPS.PROTONPASS];
        renderWithProviders(<AppsDropdown app={APPS.PROTONMAIL} />, {
            preloadedState: { availableApps: availableApps },
        });

        openDropdown();

        expect(getListedApps()).toEqual(getAppNames(availableApps));
    });

    it.each([
        ['no app', []],
        ['a single app', [APPS.PROTONMAIL]],
    ])('renders nothing with %s', (_, availableApps) => {
        const { container } = renderWithProviders(<AppsDropdown app={APPS.PROTONMAIL} />, {
            preloadedState: { availableApps: availableApps },
        });

        expect(container).toBeEmptyDOMElement();
    });
});
