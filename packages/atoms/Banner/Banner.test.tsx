import { fireEvent, render } from '@testing-library/react';

import { Button, Href } from '@proton/atoms/index';
import { IcEye } from '@proton/icons';

import Banner from './Banner';

describe('<Banner />', () => {
    it('should render with className banner and additional className', () => {
        const { container } = render(<Banner className="should-be-passed" />);

        expect(container.firstChild).toHaveClass('banner');
        expect(container.firstChild).toHaveClass('should-be-passed');
    });

    it('should render children correctly, including <strong> tags', () => {
        const { container } = render(
            <Banner>
                <strong>Important</strong> message
            </Banner>
        );

        expect(container).toHaveTextContent('Important');
        expect(container).toHaveTextContent('message');

        const strongElement = container.querySelector('strong');
        expect(strongElement).toBeInTheDocument();
        expect(strongElement).toHaveTextContent('Important');
    });

    it('should render element with text content Text', () => {
        const { container } = render(<Banner>Text</Banner>);

        expect(container.textContent).toBe('Text');
    });

    it('should render with default class when no variant is specified', () => {
        const { container } = render(<Banner>Text</Banner>);

        expect(container.firstChild).toHaveClass('banner--norm');
    });

    it('should render with a variant class when a variant is specified', () => {
        const { container } = render(<Banner variant="warning">Text</Banner>);

        expect(container.firstChild).toHaveClass('banner--warning');
    });

    it('should render an action button', () => {
        const actionButton = <Button>Click me</Button>;

        const { getByRole } = render(<Banner action={actionButton}>Test Banner</Banner>);

        const buttonElement = getByRole('button', { name: /click me/i });

        expect(buttonElement).toBeInTheDocument();
        expect(buttonElement).toHaveTextContent('Click me');
    });

    it('should render an action button with correct properties depending on the variant', () => {
        const actionButton = <Button>Click me</Button>;

        const { getByRole } = render(
            <Banner variant="danger" action={actionButton}>
                Test Banner
            </Banner>
        );

        const buttonElement = getByRole('button', { name: /click me/i });

        expect(buttonElement).toBeInTheDocument();
        expect(buttonElement).toHaveClass('button-small');
        expect(buttonElement).toHaveClass('button-outline-danger');
        expect(buttonElement).toHaveTextContent('Click me');
    });

    it('should render a link when provided', () => {
        const link = <Href href="#">Learn more</Href>;

        const { getByRole } = render(<Banner link={link}>Test Banner</Banner>);

        const linkElement = getByRole('link', { name: /Learn more/i });

        expect(linkElement).toBeInTheDocument();
        expect(linkElement).toHaveTextContent('Learn more');
    });

    it('should render a dismiss button and call onDismiss when clicked', () => {
        const onDismissMock = jest.fn();

        const { getByRole } = render(<Banner onDismiss={onDismissMock}>Test Banner</Banner>);

        const dismissButton = getByRole('button', { name: /dismiss/i });

        expect(dismissButton).toBeInTheDocument();

        fireEvent.click(dismissButton);

        expect(onDismissMock).toHaveBeenCalledTimes(1);
    });

    it('should render the default icon when no icon is provided', () => {
        const { container } = render(<Banner>Text content</Banner>);

        const iconWrapper = container.querySelector('.banner-icon');
        expect(iconWrapper).toBeInTheDocument();

        const iconElement = iconWrapper?.querySelector('svg');
        expect(iconElement).toBeInTheDocument();
        expect(iconElement?.tagName).toBe('svg');
    });

    it('should render an icon when icon prop is provided', () => {
        const { container } = render(<Banner icon={<IcEye />}>Text content</Banner>);

        const iconWrapper = container.querySelector('.banner-icon');
        expect(iconWrapper).toBeInTheDocument();

        const iconElement = iconWrapper?.querySelector('svg');
        expect(iconElement).toBeInTheDocument();
        expect(iconElement?.tagName).toBe('svg');
    });
});
