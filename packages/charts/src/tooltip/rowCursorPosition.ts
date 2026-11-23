import { Tooltip } from 'chart.js';
import type { ChartType, TooltipPositionerFunction } from 'chart.js';

export const ROW_CURSOR_POSITIONER_ID = 'protonRowCursor';

declare module 'chart.js' {
    interface TooltipPositionerMap {
        [ROW_CURSOR_POSITIONER_ID]: TooltipPositionerFunction<ChartType>;
    }
}

export const rowCursorPosition: TooltipPositionerFunction<ChartType> = (elements, eventPosition) => {
    const [active] = elements;

    if (active === undefined) {
        return false;
    }

    return {
        x: eventPosition.x,
        y: active.element.y,
        yAlign: 'center',
    };
};

export const registerRowCursorPosition = () => {
    Tooltip.positioners[ROW_CURSOR_POSITIONER_ID] = rowCursorPosition;
};
