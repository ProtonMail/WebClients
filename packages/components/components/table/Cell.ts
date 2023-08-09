import { ReactNode } from 'react';

/**
 * Allow to use colSpan and rowSpan in <TableRow>
 *     <TableRow cells={[new Cell('double-height', rowSpan: 2), 'normal', 'normal', 'normal']} />
 *     <TableRow cells={['normal', new Cell('double-width', colSpan: 2)]} />
 */
export class Cell {
    readonly content: ReactNode;

    readonly colSpan: number | undefined;

    readonly rowSpan: number | undefined;

    constructor(content: ReactNode, colSpan?: number, rowSpan?: number) {
        this.content = content;
        this.colSpan = colSpan;
        this.rowSpan = rowSpan;
    }
}

export default Cell;
