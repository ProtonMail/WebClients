import { fireEvent, screen } from '@testing-library/dom';

import useSettingsLink from '@proton/components/components/link/useSettingsLink';

import { easySwitchRender } from '../../../../tests/render';
import { DriveImportStorageWarningStep } from './DriveImportStorageWarningStep';

// useSettingsLink pulls in navigation/authentication context this test doesn't set up - stub it,
// the rest of the component (Redux dispatch, store) stays real.
jest.mock('@proton/components/components/link/useSettingsLink', () => ({
    __esModule: true,
    default: jest.fn(),
}));

const mockUseSettingsLink = useSettingsLink as jest.Mock;

describe('DriveImportStorageWarningStep', () => {
    it('lets the user ignore the warning without navigating away', () => {
        const goToSettings = jest.fn();
        mockUseSettingsLink.mockReturnValue(goToSettings);

        easySwitchRender(<DriveImportStorageWarningStep />);
        fireEvent.click(screen.getByText('Ignore'));

        expect(goToSettings).not.toHaveBeenCalled();
    });

    it('lets the user upgrade, navigating to the upgrade page', () => {
        const goToSettings = jest.fn();
        mockUseSettingsLink.mockReturnValue(goToSettings);

        easySwitchRender(<DriveImportStorageWarningStep />);
        fireEvent.click(screen.getByText('Upgrade'));

        expect(goToSettings).toHaveBeenCalledWith('/upgrade');
    });
});
