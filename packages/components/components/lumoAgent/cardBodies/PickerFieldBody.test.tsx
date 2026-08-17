import { fireEvent, render, screen, within } from '@testing-library/react';

import PickerFieldBody from './PickerFieldBody';

const baseProps = {
    action: { type: 'change_settings' as const, setting: 'theme', value: 'Snow' },
    labels: {},
    params: { setting: 'theme', value: 'Snow' },
    field: 'value',
    label: 'Theme',
};

describe('PickerFieldBody', () => {
    it('reports the picked option alongside the untouched params', () => {
        const onChange = jest.fn();
        render(
            <PickerFieldBody
                {...baseProps}
                options={[
                    { value: 'Snow', label: 'Snow' },
                    { value: 'Carbon', label: 'Carbon' },
                ]}
                onChange={onChange}
            />
        );

        fireEvent.click(screen.getByRole('button'));
        fireEvent.click(within(screen.getByTestId('select-list')).getByText('Carbon'));

        expect(onChange).toHaveBeenCalledWith({ setting: 'theme', value: 'Carbon' });
    });

    it('renders nothing when no options were resolved', () => {
        const { container } = render(<PickerFieldBody {...baseProps} options={[]} onChange={jest.fn()} />);

        expect(container).toBeEmptyDOMElement();
    });
});
