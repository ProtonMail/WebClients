import { render } from '@testing-library/react';

import Step from './Step';
import Stepper from './Stepper';

describe('<Stepper />', () => {
    it('renders a label for each item', () => {
        const { container } = render(
            <Stepper activeStep={0}>
                <Step>Item 1</Step>
                <Step>Item 2</Step>
            </Stepper>
        );

        const steps = container.querySelectorAll('li');
        const labelSelector = '.stepper-item-label';

        expect(steps[0].querySelector(labelSelector)?.textContent).toBe('Item 1');
        expect(steps[1].querySelector(labelSelector)?.textContent).toBe('Item 2');
    });

    it('renders a dot for each item', () => {
        const { container } = render(
            <Stepper activeStep={0}>
                <Step>Item 1</Step>
                <Step>Item 2</Step>
            </Stepper>
        );

        const steps = container.querySelectorAll('li');
        const dotSelector = '.stepper-item-dot';

        expect(steps[0].querySelector(dotSelector)).not.toBeNull();
        expect(steps[1].querySelector(dotSelector)).not.toBeNull();
    });

    it('renders connector if step is not the first step', () => {
        const { container } = render(
            <Stepper activeStep={0}>
                <Step>Item 1</Step>
                <Step>Item 2</Step>
            </Stepper>
        );

        const steps = container.querySelectorAll('li');
        const dotSelector = '.stepper-item-connector';

        expect(steps[0].querySelector(dotSelector)).toBeNull();
        expect(steps[1].querySelector(dotSelector)).not.toBeNull();
    });

    it('adds active class to current step', () => {
        const { container } = render(
            <Stepper activeStep={0}>
                <Step>Item 1</Step>
                <Step>Item 2</Step>
            </Stepper>
        );

        const steps = container.querySelectorAll('li');

        expect(steps[0]).toHaveClass('stepper-item--active');
    });

    it('adds completed class to previous step', () => {
        const { container } = render(
            <Stepper activeStep={1}>
                <Step>Item 1</Step>
                <Step>Item 2</Step>
            </Stepper>
        );

        const steps = container.querySelectorAll('li');

        expect(steps[0]).toHaveClass('stepper-item--completed');
    });
});
