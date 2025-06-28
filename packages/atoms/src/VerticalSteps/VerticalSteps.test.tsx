import type { RenderResult } from '@testing-library/react';
import { render } from '@testing-library/react';

import { VerticalStep, VerticalStepStatusEnum } from './VerticalStep';
import { VerticalSteps } from './VerticalSteps';

function renderBasicVerticalSteps() {
    return render(
        <VerticalSteps>
            <VerticalStep
                icon="checkmark"
                title="Choose a username"
                description="You successfully selected your new email address."
                status={VerticalStepStatusEnum.Passed}
            />
            <VerticalStep
                icon="lock"
                title="Today: get instant access"
                description="15 GB secure mailbox with unlimited personalisation."
                status={VerticalStepStatusEnum.Done}
            />
            <VerticalStep
                icon="bell"
                title="Day 24: Trial end reminder"
                description="We’ll send you a notice. Cancel anytime."
            />
            <VerticalStep
                icon="calendar-row"
                title="Day 30: Trial ends"
                description="Your subscription will start Jan 16th. Cancel anytime before."
            />
        </VerticalSteps>
    );
}

describe('<VerticalSteps /> with basic render', () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    let output: RenderResult<typeof import('@testing-library/dom/types/queries'), HTMLElement, HTMLElement>;

    beforeEach(() => {
        output = renderBasicVerticalSteps();
    });

    it('should display 4 steps', () => {
        const { container } = output;
        expect(container.querySelectorAll('li')).toHaveLength(4);
    });

    it('should display titles', () => {
        const { container } = output;
        const titles = container.querySelectorAll('.vertical-steps-item-text > span:first-child');
        expect(titles).toHaveLength(4);
        expect(titles[0].textContent).toBe('Choose a username');
        expect(titles[1].textContent).toBe('Today: get instant access');
        expect(titles[2].textContent).toBe('Day 24: Trial end reminder');
        expect(titles[3].textContent).toBe('Day 30: Trial ends');
    });

    it('should display descriptions', () => {
        const { container } = output;
        const descriptions = container.querySelectorAll('.vertical-steps-item-text > span:last-child');
        expect(descriptions).toHaveLength(4);
        expect(descriptions[0].textContent).toBe('You successfully selected your new email address.');
        expect(descriptions[1].textContent).toBe('15 GB secure mailbox with unlimited personalisation.');
        expect(descriptions[2].textContent).toBe('We’ll send you a notice. Cancel anytime.');
        expect(descriptions[3].textContent).toBe('Your subscription will start Jan 16th. Cancel anytime before.');
    });
});
