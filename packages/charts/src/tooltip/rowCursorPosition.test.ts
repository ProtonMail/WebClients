import { Tooltip } from 'chart.js';
import type { ChartType, Point, TooltipModel, TooltipPositionerFunction } from 'chart.js';

import { ROW_CURSOR_POSITIONER_ID, registerRowCursorPosition, rowCursorPosition } from './rowCursorPosition';

type Elements = Parameters<TooltipPositionerFunction<ChartType>>[0];

const activeRow = ({ x, y }: Point) => [{ element: { x, y }, datasetIndex: 0, index: 0 }] as unknown as Elements;

const tooltipModel = {} as TooltipModel<ChartType>;

const position = (elements: Elements, cursor: Point) => rowCursorPosition.call(tooltipModel, elements, cursor);

describe('rowCursorPosition', () => {
    it('follows the pointer across the chart', () => {
        expect(position(activeRow({ x: 400, y: 60 }), { x: 120, y: 58 })).toMatchObject({ x: 120 });
    });

    it('holds the height of the row it is reading, rather than drifting inside it', () => {
        expect(position(activeRow({ x: 400, y: 60 }), { x: 120, y: 71 })).toMatchObject({ x: 120, y: 60 });
    });

    it('sits level with the row rather than above or below it', () => {
        expect(position(activeRow({ x: 400, y: 60 }), { x: 120, y: 58 })).toMatchObject({ yAlign: 'center' });
    });

    it('goes nowhere where the pointer is reading nothing', () => {
        expect(position([] as unknown as Elements, { x: 120, y: 58 })).toBe(false);
    });
});

describe('registerRowCursorPosition', () => {
    it('puts the positioner where chart.js looks for one, so a chart can ask for it by name', () => {
        registerRowCursorPosition();

        expect(Tooltip.positioners[ROW_CURSOR_POSITIONER_ID]).toBe(rowCursorPosition);
    });

    it('is safe to call more than once', () => {
        expect(() => {
            registerRowCursorPosition();
            registerRowCursorPosition();
        }).not.toThrow();
    });
});
