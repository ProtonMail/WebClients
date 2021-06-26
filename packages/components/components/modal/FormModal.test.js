import React from 'react';
import { render } from '@testing-library/react';

import FormModal from './FormModal';

describe('Modal component', () => {
    const mockOnClose = jest.fn();
    const content = <div>panda</div>;

    it('should render the modal content', () => {
        const { container } = render(
            <FormModal title="Title" onClose={mockOnClose}>
                {content}
            </FormModal>
        );
        expect(container.firstChild).toBeDefined();
    });
});
