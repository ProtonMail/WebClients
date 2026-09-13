import { fireEvent, screen } from '@testing-library/dom';

import { easySwitchRender } from '../../../../tests/render';
import { DriveImportGenericErrorStep } from './DriveImportGenericErrorStep';

describe('DriveImportGenericErrorStep', () => {
    it('shows the backend message when provided, falling back to a generic one otherwise', () => {
        easySwitchRender(<DriveImportGenericErrorStep message="Backend broke" />);
        screen.getByText('Backend broke');

        easySwitchRender(<DriveImportGenericErrorStep />);
        screen.getByText('An unexpected error occurred while importing your data. Please try again later.');
    });

    it('lets the user close the error', () => {
        easySwitchRender(<DriveImportGenericErrorStep />);
        fireEvent.click(screen.getByText('Got it'));
    });
});
