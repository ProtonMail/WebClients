import { fireEvent, screen } from '@testing-library/dom';
import { vi } from 'vitest';

import { easySwitchRender } from '../../../../tests/render';
import { DriveImportGenericErrorStep } from './DriveImportGenericErrorStep';

describe('DriveImportGenericErrorStep', () => {
    it('shows the backend message when provided, falling back to a generic one otherwise', () => {
        easySwitchRender(<DriveImportGenericErrorStep message="Backend broke" onClose={vi.fn()} />);
        screen.getByText('Backend broke');

        easySwitchRender(<DriveImportGenericErrorStep onClose={vi.fn()} />);
        screen.getByText('An unexpected error occurred while importing your data. Please try again later.');
    });

    it('lets the user close the error', () => {
        easySwitchRender(<DriveImportGenericErrorStep onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('Got it'));
    });
});
