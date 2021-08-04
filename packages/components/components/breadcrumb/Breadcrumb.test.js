import { render, fireEvent } from '@testing-library/react';

import Breadcrumb from './Breadcrumb';

describe('Breadcrumb component', () => {
    const steps = ['todo', 'doing', 'done'];
    const currentStep = 1;
    const getButtons = (container) => [].slice.call(container.querySelectorAll('button'));

    it('should render all steps', () => {
        const { container } = render(<Breadcrumb list={steps} current={currentStep} />);
        const buttons = getButtons(container);

        expect(buttons.length).toBe(steps.length);
    });

    it('should mark the second step as active', () => {
        const { container } = render(<Breadcrumb list={steps} current={currentStep} />);
        const buttons = getButtons(container);

        expect(buttons[currentStep].getAttribute('aria-current')).toBe('step');
        expect(buttons[currentStep]).toHaveAttribute('disabled');
    });

    it('should select the first step', () => {
        const mockOnClick = jest.fn();
        const { container } = render(<Breadcrumb list={steps} current={currentStep} onClick={mockOnClick} />);
        const buttons = getButtons(container);

        expect(mockOnClick).toHaveBeenCalledTimes(0);
        fireEvent.click(buttons[0]);
        expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
});
