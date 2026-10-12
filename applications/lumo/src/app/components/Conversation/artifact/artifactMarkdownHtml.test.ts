import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import type { Element } from 'hast';

import { createExportPreComponent } from './artifactMarkdownHtml';

// react-markdown and remark-gfm are ESM-only and not in this package's Jest transform allowlist;
// these tests only exercise the `pre` override, so stub them out.
jest.mock('react-markdown', () => ({ __esModule: true, default: () => null }));
jest.mock('remark-gfm', () => ({ __esModule: true, default: () => undefined }));

function preNode(language: string, code: string): Element {
    return {
        type: 'element',
        tagName: 'pre',
        properties: {},
        children: [
            {
                type: 'element',
                tagName: 'code',
                properties: { className: [`language-${language}`] },
                children: [{ type: 'text', value: `${code}\n` }],
            },
        ],
    };
}

const SPEC = '{"title":{"text":"Pricing","subtitle":"Pass is cheapest"},"mark":"bar","note":"</script><b>x</b>"}';

function renderPre(charts: 'placeholder' | 'summary', node: Element, children?: string) {
    return renderToStaticMarkup(createElement(createExportPreComponent(charts), { node }, children));
}

describe('createExportPreComponent (D12)', () => {
    it('emits an inert placeholder whose spec cannot close the script early', () => {
        const html = renderPre('placeholder', preNode('vega-lite', SPEC));

        expect(html).toMatch(/^<div><script type="application\/lumo-vega-lite\+json">\{.*\}<\/script><\/div>$/);
        expect(html).toContain('\\u003c/script>\\u003cb>');
        // Only the closing tag of the placeholder itself.
        expect(html.match(/<\/script>/g)).toHaveLength(1);
        // Still the same spec once parsed as JSON.
        const json = html.slice(html.indexOf('>{') + 1, html.lastIndexOf('</script>'));
        expect(JSON.parse(json)).toEqual(JSON.parse(SPEC));
    });

    it('summarises a chart as its title and subtitle for text output', () => {
        expect(renderPre('summary', preNode('vega-lite', SPEC))).toBe('<p>Chart: Pricing — Pass is cheapest</p>');
        expect(renderPre('summary', preNode('vega-lite', '{ not json'))).toBe('<p>Chart</p>');
    });

    it('leaves non-chart code blocks as <pre>', () => {
        expect(renderPre('placeholder', preNode('json', SPEC), 'code')).toBe('<pre>code</pre>');
    });
});
