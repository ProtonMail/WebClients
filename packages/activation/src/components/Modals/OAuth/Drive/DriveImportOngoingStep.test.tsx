import { fireEvent, screen } from '@testing-library/dom';
import { vi } from 'vitest';

import { easySwitchRender } from '../../../../tests/render';
import { DriveImportOngoingStep } from './DriveImportOngoingStep';

describe('DriveImportOngoingStep', () => {
    it('shows how much was imported so far and closes from "Got it"', () => {
        const onClose = vi.fn();
        easySwitchRender(<DriveImportOngoingStep importedBytes={1024 * 1024 * 1024 * 1.2} onClose={onClose} />);

        screen.getByText('Your import is in progress');
        screen.getByText('1.20 GB');

        fireEvent.click(screen.getByText('Got it'));

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not mention the imported size before anything is imported', () => {
        easySwitchRender(<DriveImportOngoingStep importedBytes={0} onClose={vi.fn()} />);

        screen.getByText("You can open this folder when the import is finished. We'll email you when it's done.");
        expect(screen.queryByText(/So far/)).toBeNull();
    });
});
