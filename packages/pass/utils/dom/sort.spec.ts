import { JSDOM } from 'jsdom';

import { compareDomNodes } from './sort';

describe('DOM Node comparison and sorting', () => {
    let doc: Document;
    let nodes: Record<string, HTMLElement>;

    beforeEach(() => {
        const dom = new JSDOM(`
      <html>
        <body>
          <div id="n1">
            <div id="n2"></div>
            <div id="n3">
              <div id="n4"></div>
            </div>
            <div id="n5"></div>
          </div>
          <div id="n6"></div>
        </body>
      </html>
    `);
        doc = dom.window.document;

        nodes = ['n1', 'n2', 'n3', 'n4', 'n5', 'n6'].reduce<Record<string, HTMLElement>>((acc, id) => {
            acc[id] = doc.getElementById(id)!;
            return acc;
        }, {});
    });

    describe('`compareDomNodes`', () => {
        test('returns `0` for identical nodes', () => {
            expect(compareDomNodes(nodes.n1, nodes.n1)).toBe(0);
        });

        test('compares nodes at the same level', () => {
            expect(compareDomNodes(nodes.n1, nodes.n6)).toBe(-1);
            expect(compareDomNodes(nodes.n6, nodes.n1)).toBe(1);

            expect(compareDomNodes(nodes.n2, nodes.n3)).toBe(-1);
            expect(compareDomNodes(nodes.n2, nodes.n5)).toBe(-1);
            expect(compareDomNodes(nodes.n3, nodes.n2)).toBe(1);
            expect(compareDomNodes(nodes.n3, nodes.n5)).toBe(-1);
            expect(compareDomNodes(nodes.n5, nodes.n2)).toBe(1);
            expect(compareDomNodes(nodes.n5, nodes.n3)).toBe(1);
        });

        test('compares nested nodes', () => {
            expect(compareDomNodes(nodes.n4, nodes.n3)).toBe(1);
            expect(compareDomNodes(nodes.n4, nodes.n1)).toBe(1);
            expect(compareDomNodes(nodes.n3, nodes.n4)).toBe(-1);
            expect(compareDomNodes(nodes.n1, nodes.n4)).toBe(-1);
        });

        test('compares nested siblings', () => {
            expect(compareDomNodes(nodes.n4, nodes.n6)).toBe(-1);
            expect(compareDomNodes(nodes.n6, nodes.n4)).toBe(1);
        });

        test('sorts an array of DOM nodes correctly', () => {
            const unsortedNodes = [nodes.n6, nodes.n2, nodes.n4, nodes.n1, nodes.n5, nodes.n3];
            const expectedNodes = [nodes.n1, nodes.n2, nodes.n3, nodes.n4, nodes.n5, nodes.n6];
            const sortedNodes = unsortedNodes.slice().sort(compareDomNodes);
            expect(sortedNodes).toEqual(expectedNodes);
        });
    });
});
