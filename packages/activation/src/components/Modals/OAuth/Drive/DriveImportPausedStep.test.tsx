import { fireEvent, screen } from '@testing-library/dom';

import useSettingsLink from '@proton/components/components/link/useSettingsLink';

import { easySwitchRender } from '../../../../tests/render';
import { DriveImportPausedStep } from './DriveImportPausedStep';

// useSettingsLink pulls in navigation/authentication context this test doesn't set up - stub it.
jest.mock('@proton/components/components/link/useSettingsLink', () => ({
    __esModule: true,
    default: jest.fn(),
}));

const mockUseSettingsLink = useSettingsLink as jest.Mock;

describe('DriveImportPausedStep', () => {
    it('lets the user dismiss the modal without navigating away', () => {
        const goToSettings = jest.fn();
        const onClose = jest.fn();
        mockUseSettingsLink.mockReturnValue(goToSettings);

        easySwitchRender(<DriveImportPausedStep onClose={onClose} />);
        fireEvent.click(screen.getByText('Dismiss'));

        expect(onClose).toHaveBeenCalled();
        expect(goToSettings).not.toHaveBeenCalled();
    });

    it('lets the user upgrade, closing the modal and navigating to the upgrade page', () => {
        const goToSettings = jest.fn();
        const onClose = jest.fn();
        mockUseSettingsLink.mockReturnValue(goToSettings);

        easySwitchRender(<DriveImportPausedStep onClose={onClose} />);
        fireEvent.click(screen.getByText('Upgrade'));

        expect(onClose).toHaveBeenCalled();
        expect(goToSettings).toHaveBeenCalledWith('/upgrade');
    });
});
