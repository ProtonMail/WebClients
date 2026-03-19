import type { Element } from 'proton-mail/models/element';

export interface ApplyLabelsParams {
    elements: Element[];
    changes: { [labelID: string]: boolean };
    destinationLabelID: string;
    createFilters?: boolean;
    labelID: string;
    selectAll?: boolean;
    onCheckAll?: (check: boolean) => void;
}
