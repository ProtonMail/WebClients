import { type Spec, changeset, logger, parse } from 'vega';
import { expressionInterpreter } from 'vega-interpreter';

import { SecureVegaView } from './SecureVegaView';

const views: SecureVegaView[] = [];

function createView(paint: unknown, extra: Partial<Spec> = {}) {
    const container = document.createElement('div');
    const view = new SecureVegaView(
        parse(
            {
                width: 100,
                height: 100,
                data: [{ name: 'paints', values: [{ paint }] }],
                marks: [
                    {
                        type: 'group',
                        marks: [
                            {
                                type: 'rect',
                                from: { data: 'paints' },
                                encode: {
                                    update: {
                                        x: { value: 0 },
                                        y: { value: 0 },
                                        width: { value: 50 },
                                        height: { value: 50 },
                                        fill: { field: 'paint' },
                                        stroke: { field: 'paint' },
                                        cursor: { field: 'paint' },
                                    },
                                },
                            },
                        ],
                    },
                ],
                ...extra,
            },
            {},
            { ast: true }
        ),
        { renderer: 'svg', expr: expressionInterpreter }
    );
    views.push(view);
    view.initialize(container);
    return { view, container };
}

afterEach(() => {
    views.splice(0).forEach((view) => view.finalize());
    vi.restoreAllMocks();
});

describe('SecureVegaView', () => {
    it.each([
        'url(https://attacker.example/collect?d=synthetic)',
        'url("https://attacker.example/collect")',
        "url('https://attacker.example/collect')",
        'URL(//attacker.example/collect)',
        'u\\72l(https://attacker.example/collect)',
        'url(data:image/svg+xml,synthetic)',
    ])('blocks data-driven SVG paint %s before any SVG attribute is written', async (paint) => {
        const setAttribute = vi.spyOn(Element.prototype, 'setAttribute');
        const { view, container } = createView(paint);
        await view.runAsync();

        const paintWrites = setAttribute.mock.calls.filter(([name]) => name === 'fill' || name === 'stroke');
        expect(paintWrites.some(([, value]) => String(value).includes('attacker.example'))).toBe(false);
        expect(container.querySelector('rect')?.getAttribute('fill')).not.toBe(paint);
        expect(await view.toSVG()).not.toContain(paint);
    });

    it.each([
        ['#6D4AFF', 'rgb(109, 74, 255)'],
        ['red', 'rgb(255, 0, 0)'],
        ['rgb(12, 34, 56)', 'rgb(12, 34, 56)'],
        ['rgba(12, 34, 56, 0.5)', 'rgba(12, 34, 56, 0.5)'],
        ['hsl(120, 100%, 50%)', 'rgb(0, 255, 0)'],
        ['none', 'none'],
        ['currentColor', 'currentColor'],
    ])('preserves ordinary data-driven color %s', async (paint, expected) => {
        const { view } = createView(paint);
        await view.runAsync();

        const svg = await view.toSVG();
        expect(svg).toContain(`fill="${expected}"`);
        expect(svg).toContain(`stroke="${expected}"`);
    });

    it('blocks paints calculated by expressions and rechecks subsequent data updates', async () => {
        const { view, container } = createView('red', {
            data: [
                {
                    name: 'paints',
                    values: [{ destination: 'https://attacker.example/collect' }],
                    transform: [{ type: 'formula', expr: "'u' + 'rl(' + datum.destination + ')'", as: 'paint' }],
                },
            ],
        });
        await view.runAsync();
        expect(container.innerHTML).not.toContain('fill="url(');

        view.change(
            'paints',
            changeset()
                .remove(() => true)
                .insert([{ destination: 'https://other.example/collect' }])
        );
        await view.runAsync();
        expect(container.innerHTML).not.toContain('fill="url(');
        expect(await view.toSVG()).not.toContain('stroke="url(');
    });

    it.each([
        'url(https://attacker.example/cursor?d=synthetic), auto',
        'u\\72l(https://attacker.example/cursor), pointer',
    ])('blocks URL-valued cursors before hovering a chart mark', async (paint) => {
        const styleWrites = vi.spyOn(CSSStyleDeclaration.prototype, 'setProperty');
        const { view, container } = createView(paint);
        await view.runAsync();
        const mark = container.querySelector('.mark-rect path');
        expect(mark).not.toBeNull();

        mark!.dispatchEvent(new MouseEvent('pointermove', { bubbles: true }));
        await view.runAsync();

        const cursorWrites = styleWrites.mock.calls.filter(([name]) => name === 'cursor');
        expect(cursorWrites.length).toBeGreaterThan(0);
        expect(cursorWrites.every(([, value]) => value === 'default')).toBe(true);
        expect(container.style.cursor).toBe('default');
    });

    it.each(['pointer', 'crosshair', 'grab', 'zoom-in'])('preserves the %s cursor on hover', async (paint) => {
        const { view, container } = createView(paint);
        await view.runAsync();
        const mark = container.querySelector('.mark-rect path');
        expect(mark).not.toBeNull();

        mark!.dispatchEvent(new MouseEvent('pointermove', { bubbles: true }));
        await view.runAsync();

        expect(container.style.cursor).toBe(paint);
    });

    it('keeps inline gradients but neutralizes URL-valued stops', async () => {
        const { view } = createView({
            gradient: 'linear',
            x1: 0,
            x2: 1,
            stops: [
                { offset: 0, color: '#6D4AFF' },
                { offset: 1, color: 'url(https://attacker.example/collect)' },
            ],
        });
        await view.runAsync();

        const svg = await view.toSVG();
        expect(svg).toContain('<linearGradient');
        expect(svg).toContain('stop-color="rgb(109, 74, 255)"');
        expect(svg).toContain('stop-color="rgba(0, 0, 0, 0)"');
        expect(svg).not.toContain('attacker.example');
    });

    it('protects SVG backgrounds including headless export', async () => {
        const { view } = createView('red', { background: 'url(https://attacker.example/collect)' });
        await view.runAsync();
        expect(view.background()).toBeNull();
        expect(await view.toSVG()).not.toContain('attacker.example');

        view.background('#ffffff');
        await view.runAsync();
        expect(await view.toSVG()).toContain('fill="rgb(255, 255, 255)"');
    });

    it('protects headless exports even when no live renderer was initialized', async () => {
        const { view } = createView('url(https://attacker.example/collect)');
        view.renderer('none');
        await view.runAsync();

        const svg = await view.toSVG();
        expect(svg).toContain('M0,0h50v50h-50Z');
        expect(svg).not.toContain('attacker.example');
    });

    it('blocks partially encoded paints even when another encoder aborts the dataflow', async () => {
        const error = vi.fn();
        const setAttribute = vi.spyOn(Element.prototype, 'setAttribute');
        const { view } = createView('red', {
            marks: [
                {
                    type: 'rect',
                    from: { data: 'paints' },
                    encode: {
                        update: {
                            fill: { value: 'url(https://attacker.example/collect)' },
                            x: { signal: 'datum.missing.value' },
                        },
                    },
                },
            ],
        });
        const testLogger = logger();
        testLogger.error = error;
        view.logger(testLogger);
        await view.runAsync();

        expect(error).toHaveBeenCalled();
        const paintWrites = setAttribute.mock.calls.filter(([name]) => name === 'fill' || name === 'stroke');
        expect(paintWrites.some(([, value]) => String(value).includes('attacker.example'))).toBe(false);
        expect(await view.toSVG()).not.toContain('attacker.example');
    });
});
