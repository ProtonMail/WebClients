import React from 'react';
import { render } from 'react-testing-library';

import Modal from './Modal';

describe('Modal component', () => {
    const mockOnClose = jest.fn();
    const content = <div>panda</div>;
    const wrapper = (children) => <div className="modal-root">{children}</div>;

    it('should render the modal content', () => {
        const { container } = render(wrapper(<Modal onClose={mockOnClose}>{content}</Modal>));
        expect(container.firstChild).toBeDefined();
    });
});
