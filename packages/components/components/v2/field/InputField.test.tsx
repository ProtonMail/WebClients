import { render } from '@testing-library/react';

import InputFieldTwo from './InputField';

const ComponentWithDefaultTestId = (props: any) => {
    return (
        <div data-testid="foo" {...props}>
            bar
        </div>
    );
};

describe('input field test', () => {
    it('should not override default data-testid', () => {
        const { getByTestId } = render(<InputFieldTwo as={ComponentWithDefaultTestId} />);
        expect(getByTestId('foo')).toBeVisible();
    });

    it('should let data-testid be defined', () => {
        const { getByTestId, queryByTestId } = render(
            <InputFieldTwo data-testid="bar" as={ComponentWithDefaultTestId} />
        );
        expect(getByTestId('bar')).toBeVisible();
        expect(queryByTestId('foo')).toBeNull();
    });
});
