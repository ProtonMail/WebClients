import { render } from '@testing-library/react';

import DashboardCard, { DashboardCardContent, DashboardCardImage } from './DashboardCard';

describe('<DashboardCard />', () => {
    it('renders with a border and background by default', () => {
        const { container } = render(<DashboardCard>Lorem ipsum</DashboardCard>);
        expect(container.firstChild).toHaveClass('DashboardCard');
    });

    it('applies the correct rounded class based on prop value', () => {
        const { container: defaultCard } = render(<DashboardCard />);
        expect(defaultCard.firstChild).toHaveClass('rounded-xl');

        const { container: mdCard } = render(<DashboardCard rounded="md" />);
        expect(mdCard.firstChild).toHaveClass('rounded');

        const { container: lgCard } = render(<DashboardCard rounded="lg" />);
        expect(lgCard.firstChild).toHaveClass('rounded-lg');

        const { container: xlCard } = render(<DashboardCard rounded="xl" />);
        expect(xlCard.firstChild).toHaveClass('rounded-xl');
    });

    it('renders a div by default', () => {
        const { container } = render(<DashboardCard />);
        expect(container.firstChild?.nodeName).toBe('DIV');
    });

    it('renders as different elements when "as" prop is provided', () => {
        const { container: sectionCard } = render(<DashboardCard as="section">Section Content</DashboardCard>);
        expect(sectionCard.firstChild?.nodeName).toBe('SECTION');

        const { container: articleCard } = render(<DashboardCard as="article">Article Content</DashboardCard>);
        expect(articleCard.firstChild?.nodeName).toBe('ARTICLE');
    });

    it('merges custom className with default classes', () => {
        const { container } = render(<DashboardCard className="custom-class" />);
        expect(container.firstChild).toHaveClass('DashboardCard', 'custom-class');
    });

    it('renders children content', () => {
        const { getByText } = render(<DashboardCard>Child Content</DashboardCard>);
        expect(getByText('Child Content')).toBeInTheDocument();
    });
});

describe('<DashboardCardImage />', () => {
    it('renders correctly with children', () => {
        const { container } = render(<DashboardCardImage>Image Content</DashboardCardImage>);
        expect(container.firstChild).toHaveClass('DashboardCard-image');
    });
});

describe('<DashboardCardContent />', () => {
    it('renders with default padding', () => {
        const { container } = render(<DashboardCardContent>Content</DashboardCardContent>);
        expect(container.firstChild).toHaveClass('p-4 md:p-6');
    });

    it('allows custom padding class', () => {
        const { container } = render(<DashboardCardContent paddingClass="p-8">Content</DashboardCardContent>);
        expect(container.firstChild).toHaveClass('p-8');
    });

    it('applies both paddingClass and className to DashboardCardContent', () => {
        const { container } = render(
            <DashboardCardContent paddingClass="p-8" className="extra-class">
                Content
            </DashboardCardContent>
        );
        expect(container.firstChild).toHaveClass('p-8 extra-class');
    });
});

describe('DashboardCard Component Suite', () => {
    it('renders all components together correctly', () => {
        const { container, getByText } = render(
            <DashboardCard className="custom-card">
                <DashboardCardImage className="custom-image">Image Content</DashboardCardImage>
                <DashboardCardContent paddingClass="p-8" className="custom-content">
                    Card Content
                </DashboardCardContent>
            </DashboardCard>
        );

        // DashboardCard renders with correct classes
        expect(container.firstChild).toHaveClass('DashboardCard', 'rounded-xl', 'custom-card');

        // DashboardCardImage renders inside DashboardCard
        const imageElement = getByText('Image Content');
        expect(imageElement).toBeInTheDocument();
        expect(imageElement).toHaveClass('DashboardCard-image', 'custom-image');

        // DashboardCardContent renders inside DashboardCard
        const contentElement = getByText('Card Content');
        expect(contentElement).toBeInTheDocument();
        expect(contentElement).toHaveClass('DashboardCard-content', 'p-8', 'custom-content');
    });
});
