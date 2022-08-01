import { render } from '@testing-library/react';

import Button from './Button';

describe('<Button />', () => {
    it('should do something', () => {
        const { container } = render(<Button />);

        console.log(container);
    });
});
