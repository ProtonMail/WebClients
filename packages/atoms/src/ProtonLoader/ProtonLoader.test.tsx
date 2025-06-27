import { render } from '@testing-library/react';

import { ProtonLoader, ProtonLoaderType } from './ProtonLoader';

const protonLoaderTestId = 'proton-loader';

describe('<ProtonLoader />', () => {
    it('passes className', () => {
        const { getByTestId } = render(<ProtonLoader className="should-be-passed" data-testid={protonLoaderTestId} />);

        const element = getByTestId(protonLoaderTestId);

        expect(element).toHaveClass('should-be-passed');
    });

    it('renders default type', () => {
        const { getByTestId } = render(<ProtonLoader data-testid={protonLoaderTestId} />);

        const element = getByTestId(protonLoaderTestId);

        expect(element.firstChild).toHaveAttribute('fill', '#6D4AFF');
    });

    it('renders negative type', () => {
        const { getByTestId } = render(
            <ProtonLoader type={ProtonLoaderType.Negative} data-testid={protonLoaderTestId} />
        );

        const element = getByTestId(protonLoaderTestId);

        expect(element.firstChild).toHaveAttribute('fill', '#FFFFFF');
    });
});
