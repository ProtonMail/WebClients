import { screen } from '@testing-library/dom';

import { easySwitchRender } from '../../../../tests/render';
import { DriveImportEmptyStep } from './DriveImportEmptyStep';

describe('DriveImportEmptyStep', () => {
    it('explains that nothing was found to import, with a retry action', () => {
        easySwitchRender(<DriveImportEmptyStep />);

        screen.getByText('We could not find anything to import');
        screen.getByText('Try again');
    });
});
