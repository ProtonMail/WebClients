import { fireEvent, screen } from '@testing-library/dom';
import { vi } from 'vitest';

import { easySwitchRender } from '../../../../tests/render';
import { DriveImportSuccessStep } from './DriveImportSuccessStep';

describe('DriveImportSuccessStep', () => {
    it('hides "Go to folder" when the import folder is unknown', () => {
        easySwitchRender(<DriveImportSuccessStep onClose={vi.fn()} />);

        expect(screen.queryByText('Go to folder')).toBeNull();
    });

    it('opens the import folder from "Go to folder"', () => {
        const onGoToFolder = vi.fn();
        easySwitchRender(<DriveImportSuccessStep onClose={vi.fn()} onGoToFolder={onGoToFolder} />);

        fireEvent.click(screen.getByText('Go to folder'));

        expect(onGoToFolder).toHaveBeenCalledTimes(1);
    });
});
