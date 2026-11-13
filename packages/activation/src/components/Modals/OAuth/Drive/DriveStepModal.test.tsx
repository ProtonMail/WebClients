import { fireEvent, screen } from '@testing-library/dom';
import { vi } from 'vitest';

import { easySwitchRender } from '../../../../tests/render';
import { DriveStepModal } from './DriveStepModal';

describe('DriveStepModal', () => {
    it('renders the media and content, and triggers the primary action on click', () => {
        const onClick = vi.fn();

        easySwitchRender(
            <DriveStepModal media={<div>media content</div>} primaryAction={{ label: 'Continue', onClick }}>
                <p>step content</p>
            </DriveStepModal>
        );

        screen.getByText('media content');
        screen.getByText('step content');

        fireEvent.click(screen.getByText('Continue'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('only renders the secondary action when one is provided, and wires its click', () => {
        easySwitchRender(
            <DriveStepModal media={null} primaryAction={{ label: 'Continue', onClick: () => {} }}>
                content
            </DriveStepModal>
        );
        expect(screen.queryByText('Cancel')).toBeNull();

        const onSecondaryClick = vi.fn();
        easySwitchRender(
            <DriveStepModal
                media={null}
                primaryAction={{ label: 'Continue', onClick: () => {} }}
                secondaryAction={{ label: 'Cancel', onClick: onSecondaryClick }}
            >
                content
            </DriveStepModal>
        );
        fireEvent.click(screen.getByText('Cancel'));
        expect(onSecondaryClick).toHaveBeenCalledTimes(1);
    });

    it('disables the close button while closeDisabled is set, and forwards onClose otherwise', () => {
        const onClose = vi.fn();

        easySwitchRender(
            <DriveStepModal
                onClose={onClose}
                closeDisabled
                media={null}
                primaryAction={{ label: 'Continue', onClick: () => {} }}
            >
                content
            </DriveStepModal>
        );
        expect(screen.getByTestId('modal:close')).toBeDisabled();
    });
});
