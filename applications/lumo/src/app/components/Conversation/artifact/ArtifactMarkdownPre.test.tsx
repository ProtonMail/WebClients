import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Element } from 'hast';

import { ArtifactMarkdownPre } from './ArtifactMarkdownPre';
import { readArtifactChartFence, readArtifactCodeFence } from './artifactCharts';

// react-markdown is ESM-only and not in this package's Jest transform allowlist, so these tests feed
// the `pre` override the same hast node react-markdown passes it, rather than rendering markdown.
jest.mock('../../LumoMarkdown/vega/VegaLiteChart', () => ({
    VegaLiteChart: ({ code, language }: { code: string; language: string }) => {
        return <div data-testid="vega-chart" data-language={language} data-code={code} />;
    },
}));

const mockShowCopyNotification = jest.fn();
jest.mock('../../../hooks/useCopyNotification', () => ({
    useCopyNotification: () => {
        return { showCopyNotification: mockShowCopyNotification };
    },
}));

jest.mock('../../../hooks/useIsLumoSmallScreen', () => ({
    useIsLumoSmallScreen: () => {
        return { isSmallScreen: false, isMediumScreen: false };
    },
}));

const SPEC = '{"mark":"bar","encoding":{"x":{"field":"a"}},"data":{"values":[{"a":1}]}}';

function preNode(language: string | null, code: string): Element {
    return {
        type: 'element',
        tagName: 'pre',
        properties: {},
        children: [
            {
                type: 'element',
                tagName: 'code',
                properties: language ? { className: [`language-${language}`] } : {},
                children: [{ type: 'text', value: `${code}\n` }],
            },
        ],
    };
}

describe('readArtifactChartFence (D12 strict mode)', () => {
    it('accepts explicit vega and vega-lite fences', () => {
        expect(readArtifactChartFence(preNode('vega-lite', SPEC))).toEqual({ language: 'vega-lite', code: SPEC });
        expect(readArtifactChartFence(preNode('vega', SPEC))?.language).toBe('vega');
    });

    it('rejects json or unlabelled blocks even when they look like a spec', () => {
        expect(readArtifactChartFence(preNode('json', SPEC))).toBeNull();
        expect(readArtifactChartFence(preNode(null, SPEC))).toBeNull();
    });
});

// Indentation and blank lines are what manual selection used to mangle, so the copy must keep them as written.
const PYTHON = 'def greet(name):\n    if name:\n        print(name)\n\n    return None';

describe('readArtifactCodeFence', () => {
    it('returns the source as written, minus the trailing newline before the closing fence', () => {
        expect(readArtifactCodeFence(preNode('python', PYTHON))).toEqual({ language: 'python', code: PYTHON });
    });

    it('reads unlabelled blocks with an empty language', () => {
        expect(readArtifactCodeFence(preNode(null, 'ls -la'))).toEqual({ language: '', code: 'ls -la' });
    });
});

describe('ArtifactMarkdownPre', () => {
    it('renders a vega-lite fence as a chart instead of a <pre>', async () => {
        const { container } = render(<ArtifactMarkdownPre node={preNode('vega-lite', SPEC)} />);

        const chart = await screen.findByTestId('vega-chart');
        expect(chart.getAttribute('data-code')).toBe(SPEC);
        expect(container.querySelector('pre')).toBeNull();
    });

    it('renders any other block as a plain <pre> with its children', () => {
        const { container } = render(
            <ArtifactMarkdownPre node={preNode('json', SPEC)} className="x">
                <code>{SPEC}</code>
            </ArtifactMarkdownPre>
        );

        expect(container.querySelector('pre.x code')?.textContent).toBe(SPEC);
        expect(screen.queryByTestId('vega-chart')).toBeNull();
    });

    it("copies only that block's raw source to the clipboard", async () => {
        const writeText = jest.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

        render(
            <ArtifactMarkdownPre node={preNode('python', PYTHON)}>
                <code>{PYTHON}</code>
            </ArtifactMarkdownPre>
        );
        fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

        await waitFor(() => {
            expect(mockShowCopyNotification).toHaveBeenCalled();
        });
        expect(writeText).toHaveBeenCalledWith(PYTHON);
    });

    it('does not add a copy control to a chart', async () => {
        render(<ArtifactMarkdownPre node={preNode('vega-lite', SPEC)} />);

        await screen.findByTestId('vega-chart');
        expect(screen.queryByRole('button', { name: 'Copy' })).toBeNull();
    });
});
