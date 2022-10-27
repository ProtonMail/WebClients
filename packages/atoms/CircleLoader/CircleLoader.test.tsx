import { render } from '@testing-library/react';

import CircleLoader from './CircleLoader';

const circleLoaderTestId = 'circle-loader';

describe('<CircleLoader />', () => {
    it('passes className', () => {
        const { getByTestId } = render(<CircleLoader className="should-be-passed" data-testid={circleLoaderTestId} />);

        const circleLoaderElement = getByTestId(circleLoaderTestId);

        expect(circleLoaderElement).toHaveClass('should-be-passed');
    });

    it('defaults to small size', () => {
        const { getByTestId } = render(<CircleLoader data-testid={circleLoaderTestId} />);

        const circleLoaderElement = getByTestId(circleLoaderTestId);

        expect(circleLoaderElement).toHaveClass('circle-loader');
    });

    it('adds is-medium class when size is medium', () => {
        const { getByTestId } = render(<CircleLoader size="medium" data-testid={circleLoaderTestId} />);

        const circleLoaderElement = getByTestId(circleLoaderTestId);

        expect(circleLoaderElement).toHaveClass('is-medium');
    });

    it('adds is-large class when size is large', () => {
        const { getByTestId } = render(<CircleLoader size="large" data-testid={circleLoaderTestId} />);

        const circleLoaderElement = getByTestId(circleLoaderTestId);

        expect(circleLoaderElement).toHaveClass('is-large');
    });

    it('renders sr-only item', () => {
        const { getByTestId } = render(<CircleLoader data-testid={circleLoaderTestId} />);

        const circleLoaderElement = getByTestId(circleLoaderTestId);
        const srElement = circleLoaderElement.nextSibling;

        expect(srElement).toHaveClass('sr-only');
        expect(srElement?.textContent).toBe('Loading');
    });
});
