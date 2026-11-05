import { fireEvent, screen } from '@testing-library/dom';

import { easySwitchRender } from '../../../../tests/render';
import { DriveImportSuccessStep } from './DriveImportSuccessStep';

describe('DriveImportSuccessStep', () => {
    it('hides "Go to folder" when the import folder is unknown', () => {
        easySwitchRender(<DriveImportSuccessStep onClose={jest.fn()} />);

        expect(screen.queryByText('Go to folder')).toBeNull();
    });

    it('opens the import folder from "Go to folder"', () => {
        const onGoToFolder = jest.fn();
        easySwitchRender(<DriveImportSuccessStep onClose={jest.fn()} onGoToFolder={onGoToFolder} />);

        fireEvent.click(screen.getByText('Go to folder'));

        expect(onGoToFolder).toHaveBeenCalledTimes(1);
    });
});
