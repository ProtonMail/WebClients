import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { EasySwitchSpotlight } from './EasySwitchSpotlight';

// happy-dom leaves the `finished` promise of a cancelled animation unhandled (browsers mark it handled), and the
// illustration cancels its animations on unmount
vi.mock('@proton/activation/src/components/Modals/OAuth/Drive/illustrations/TransferLockIllustration', () => ({
    TransferLockIllustration: () => null,
}));

describe('EasySwitchSpotlight', () => {
    const setup = () => {
        const target = document.createElement('div');
        document.body.appendChild(target);
        const onClose = vi.fn();
        const onImport = vi.fn();
        render(<EasySwitchSpotlight target={target} onClose={onClose} onImport={onImport} />);
        return { onClose, onImport };
    };

    it('starts the import on Import now', () => {
        const { onClose, onImport } = setup();

        fireEvent.click(screen.getByText('Import now'));

        expect(onImport).toHaveBeenCalledTimes(1);
        expect(onClose).not.toHaveBeenCalled();
    });

    it('closes on Maybe later and on the close button', () => {
        const { onClose, onImport } = setup();

        fireEvent.click(screen.getByText('Maybe later'));
        fireEvent.click(screen.getByTestId('modal:close'));

        expect(onClose).toHaveBeenCalledTimes(2);
        expect(onImport).not.toHaveBeenCalled();
    });
});
