import { render } from '@testing-library/react';

import ButtonLike from './ButtonLike';

describe('<ButtonLike />', () => {
    it('should do something', () => {
        const { container } = render(<ButtonLike />);

        console.log(container);
    });
});
