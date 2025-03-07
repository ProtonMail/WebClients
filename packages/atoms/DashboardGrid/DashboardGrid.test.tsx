import { render } from '@testing-library/react';

import DashboardGrid, {
    DashboardGridSection,
    DashboardGridSectionHeader,
    DashboardGridSectionSubtitle,
    DashboardGridSectionTitle,
} from './DashboardGrid';

describe('<DashboardGrid />', () => {
    it('renders with default element (section)', () => {
        const { container } = render(<DashboardGrid>Grid Content</DashboardGrid>);
        expect(container.firstChild?.nodeName).toBe('SECTION');
    });

    it('renders as different elements when "as" prop is provided', () => {
        const { container } = render(<DashboardGrid as="div">Grid Content</DashboardGrid>);
        expect(container.firstChild?.nodeName).toBe('DIV');
    });

    it('applies custom class names', () => {
        const { container } = render(<DashboardGrid className="custom-grid" />);
        expect(container.firstChild).toHaveClass('custom-grid');
    });

    it('limits the number of columns to a maximum of 3', () => {
        const { container } = render(<DashboardGrid columns={5} />);
        expect(container.firstChild).toHaveClass('DashboardGrid-columns-3'); // Ensures max is 3
    });

    it('applies the correct column class when valid values are passed', () => {
        const { container } = render(<DashboardGrid columns={2} />);
        expect(container.firstChild).toHaveClass('DashboardGrid-columns-2');
    });

    it('renders children correctly', () => {
        const { getByText } = render(
            <DashboardGrid>
                <div>Child Element</div>
            </DashboardGrid>
        );
        expect(getByText('Child Element')).toBeInTheDocument();
    });
});

describe('<DashboardGridSection />', () => {
    it('renders correctly with position class', () => {
        const { container } = render(
            <DashboardGridSection position="header-left">Section Content</DashboardGridSection>
        );
        expect(container.firstChild).toHaveClass('DashboardGrid-Section', 'DashboardGrid-Section-header-left');
    });

    it('renders with spanAll prop', () => {
        const { container } = render(<DashboardGridSection spanAll="content">Span All Content</DashboardGridSection>);
        expect(container.firstChild).toHaveClass('DashboardGrid-Section-content-span-all');
    });

    it('renders children inside section', () => {
        const { getByText } = render(<DashboardGridSection>Test Section</DashboardGridSection>);
        expect(getByText('Test Section')).toBeInTheDocument();
    });
});

describe('<DashboardGridSectionHeader />', () => {
    it('renders title correctly', () => {
        const { getByText } = render(<DashboardGridSectionHeader title="Test Title" />);
        expect(getByText('Test Title')).toBeInTheDocument();
    });

    it('renders subtitle if provided', () => {
        const { getByText } = render(<DashboardGridSectionHeader title="Title" subtitle="Subtitle" />);
        expect(getByText('Subtitle')).toBeInTheDocument();
    });

    it('renders CTA if provided', () => {
        const { getByText } = render(<DashboardGridSectionHeader title="Title" cta={<button>Click Me</button>} />);
        expect(getByText('Click Me')).toBeInTheDocument();
    });
});

describe('<DashboardGridSectionTitle />', () => {
    it('renders the title inside an h2 tag', () => {
        const { getByText } = render(<DashboardGridSectionTitle>Title</DashboardGridSectionTitle>);
        expect(getByText('Title').nodeName).toBe('H2');
    });

    it('renders CTA when provided', () => {
        const { getByText } = render(
            <DashboardGridSectionTitle cta={<button>CTA Button</button>}>Title</DashboardGridSectionTitle>
        );
        expect(getByText('CTA Button')).toBeInTheDocument();
    });
});

describe('<DashboardGridSectionSubtitle />', () => {
    it('renders the subtitle text', () => {
        const { getByText } = render(<DashboardGridSectionSubtitle>Subtitle</DashboardGridSectionSubtitle>);
        expect(getByText('Subtitle')).toBeInTheDocument();
    });
});
