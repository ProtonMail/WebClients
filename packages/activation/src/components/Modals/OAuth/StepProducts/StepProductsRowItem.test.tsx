import { fireEvent, screen } from '@testing-library/dom';
import { vi } from 'vitest';

import { easySwitchRender } from '../../../../tests/render';
import StepProductsRowItem from './StepProductsRowItem';

describe('StepProductsRowItem', () => {
    it('Should render the default component when no errors', () => {
        easySwitchRender(<StepProductsRowItem id="mail" label="label" value={true} setValue={vi.fn()} />);
        screen.getByTestId('StepProductsRowItem:label');
    });

    it('Should render the error component when has errors', () => {
        easySwitchRender(
            <StepProductsRowItem id="mail" label="label" value={true} setValue={vi.fn()} error={'There is an error'} />
        );
        screen.getByText('There is an error');
    });

    it('Should render a warning when the component is disabled', () => {
        easySwitchRender(
            <StepProductsRowItem id="mail" label="label" value={true} setValue={vi.fn()} disabled={true} />
        );
        screen.getByText('(Temporarily unavailable. Please check back later.)');
    });

    it('Should update the value when the checkbox is clicked', () => {
        const setValue = vi.fn();
        easySwitchRender(<StepProductsRowItem id="mail" label="label" value={true} setValue={setValue} />);

        const label = screen.getByTestId('StepProductsRowItem:label');
        fireEvent.click(label);

        expect(setValue).toHaveBeenCalledTimes(1);
    });
});
