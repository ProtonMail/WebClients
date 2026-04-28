import { render, screen } from '@testing-library/react';

import { InfoIconTooltip, InfoIconTooltipRenderMode } from './index';

describe('InfoIconTooltip', () => {
    it('renders an icon with the title as accessible label', () => {
        render(<InfoIconTooltip title="More info" />);

        expect(screen.getByText('More info')).toBeInTheDocument();
    });

    it('wraps the icon in a span so the Tooltip has a ref-able anchor', () => {
        const { container } = render(<InfoIconTooltip title="More info" />);

        const svg = container.querySelector('svg');
        expect(svg?.parentElement?.tagName).toBe('SPAN');
    });

    it('uses the outlined icon at size 14px by default', () => {
        const { container } = render(<InfoIconTooltip title="More info" />);

        const svg = container.querySelector('svg');
        expect(svg).toHaveClass('icon-size-3.5');
    });

    it('uses the filled icon at size 20px and color-disabled when renderMode is FILLED', () => {
        const { container } = render(
            <InfoIconTooltip title="More info" renderMode={InfoIconTooltipRenderMode.FILLED} />
        );

        const svg = container.querySelector('svg');
        expect(svg).toHaveClass('icon-size-5');

        const wrapper = svg?.parentElement;
        expect(wrapper).toHaveClass('color-disabled');
    });

    it('applies a caller-supplied className to the icon wrapper', () => {
        const { container } = render(<InfoIconTooltip title="More info" className="class-1 class-2" />);

        const wrapper = container.querySelector('svg')?.parentElement;
        expect(wrapper).toHaveClass('class-1');
        expect(wrapper).toHaveClass('class-2');
    });

    it('merges the FILLED color-disabled class with caller-supplied className', () => {
        const { container } = render(
            <InfoIconTooltip title="More info" renderMode={InfoIconTooltipRenderMode.FILLED} className="class-1" />
        );

        const wrapper = container.querySelector('svg')?.parentElement;
        expect(wrapper).toHaveClass('color-disabled');
        expect(wrapper).toHaveClass('class-1');
    });
});
