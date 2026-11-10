import { render } from '@testing-library/react';

import Option from '../option/Option';
import { InputField as InputFieldTwo } from '../v2/field/InputField';
import SearchableSelect from './SearchableSelect';

describe('SearchableSelect accessible name', () => {
    const options = [<Option title="one" value="one" key="one" />, <Option title="two" value="two" key="two" />];

    it('uses the selected value as the name when unlabelled', () => {
        const { getByTestId } = render(
            <SearchableSelect value="two" data-testid="dropdown-button">
                {options}
            </SearchableSelect>
        );

        expect(getByTestId('dropdown-button')).toHaveAccessibleName('two');
    });

    it('is named by its field label and described by its selected value', () => {
        const { getByRole } = render(
            <InputFieldTwo as={SearchableSelect} label="Country" value="two" assistiveText="Pick one">
                {options}
            </InputFieldTwo>
        );

        expect(getByRole('button', { name: 'Country' })).toHaveAccessibleDescription('two Pick one');
    });
});
