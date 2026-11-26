import tinycolor from 'tinycolor2';
import { type Color, type Scene, View, sceneVisit } from 'vega';

const evaluateVegaView = Reflect.get(View.prototype, 'evaluate') as (...args: unknown[]) => Promise<View>;
const GRADIENT_COORDINATES = ['x1', 'y1', 'x2', 'y2', 'r1', 'r2'] as const;

interface PaintRenderer {
    renderAsync(scene: Scene, ...args: unknown[]): Promise<unknown>;
}

function sanitizePaint(value: unknown): unknown {
    if (value === null || value === undefined || value === 'none' || value === 'currentColor') {
        return value;
    }

    if (typeof value === 'object' && 'gradient' in value) {
        return sanitizeGradient(value as Record<string, unknown>);
    }

    if (typeof value !== 'string' && (typeof value !== 'object' || value === null)) {
        return null;
    }

    const color = tinycolor(value as tinycolor.ColorInput);
    return color.isValid() ? color.toRgbString() : null;
}

function sanitizeGradient(value: Record<string, unknown>): Record<string, unknown> | null {
    if ((value.gradient !== 'linear' && value.gradient !== 'radial') || !Array.isArray(value.stops)) {
        return null;
    }

    const gradient: Record<string, unknown> = {
        gradient: value.gradient,
        stops: value.stops.map((stop: unknown) => {
            if (stop === null || typeof stop !== 'object' || !('offset' in stop) || !('color' in stop)) {
                return { offset: 0, color: 'transparent' };
            }
            return {
                offset: typeof stop.offset === 'number' && Number.isFinite(stop.offset) ? stop.offset : 0,
                color: typeof stop.color === 'string' ? (sanitizePaint(stop.color) ?? 'transparent') : 'transparent',
            };
        }),
    };

    for (const coordinate of GRADIENT_COORDINATES) {
        if (typeof value[coordinate] === 'number' && Number.isFinite(value[coordinate])) {
            gradient[coordinate] = value[coordinate];
        }
    }
    if (typeof value.id === 'string' && /^[A-Za-z_][A-Za-z0-9_-]*$/.test(value.id)) {
        gradient.id = value.id;
    }
    return gradient;
}

export class SecureVegaView extends View {
    declare _renderer: PaintRenderer | null;
    private securedRenderer: PaintRenderer | null = null;

    override background(): Color;
    override background(value: Color): this;
    override background(value?: Color): Color | this {
        if (arguments.length > 0) {
            return super.background(value as Color);
        }
        return sanitizePaint(super.background()) as Color;
    }

    async evaluate(...args: unknown[]): Promise<View> {
        const renderer = this._renderer;
        if (renderer && renderer !== this.securedRenderer) {
            const renderAsync = renderer.renderAsync;
            // An aborted dataflow skips runAfter callbacks but can still render partially updated marks.
            renderer.renderAsync = (scene, ...renderArgs) => {
                sanitizeScenePaints(scene);
                return renderAsync.call(renderer, scene, ...renderArgs);
            };
            this.securedRenderer = renderer;
        }

        const view = await evaluateVegaView.apply(this, args);
        // Headless SVG/PNG exports create their renderer only after the dataflow completes.
        const { root } = this.scenegraph() as unknown as { root: Scene };
        sanitizeScenePaints(root);
        return view;
    }
}

function sanitizeScenePaints(scene: Scene): void {
    sceneVisit(scene, (item) => {
        const paints = item as unknown as Record<string, unknown>;
        for (const property of ['fill', 'stroke'] as const) {
            if (property in paints) {
                paints[property] = sanitizePaint(paints[property]);
            }
        }
        if ('cursor' in paints && (typeof paints.cursor !== 'string' || !/^[a-z-]+$/i.test(paints.cursor))) {
            delete paints.cursor;
        }
        if ('items' in item) {
            sanitizeScenePaints(item as Scene);
        }
    });
}
