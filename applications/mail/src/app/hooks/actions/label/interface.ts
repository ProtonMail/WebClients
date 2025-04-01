import type { Element } from 'proton-mail/models/element';

export interface ApplyLabelsParams {
    elements: Element[];
    changes: { [labelID: string]: boolean };
    createFilters?: boolean;
    silent?: boolean;
    selectedLabelIDs?: string[];
    labelID: string;
    selectAll?: boolean;
    onCheckAll?: (check: boolean) => void;
}

export interface ApplyLabelsToSelectionParams extends ApplyLabelsParams {
    isMessage: boolean;
}
