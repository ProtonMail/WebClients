import React from 'react';
import { render } from '@testing-library/react';

import Dots from './Dots';

describe('Dots component', () => {
    render(<Dots amount={3} active={2} />);

    it('renders as many dots as specified in the "amount" prop', () => {});

    it('applies the active class to the the dot at the "active" prop index', () => {});
});
