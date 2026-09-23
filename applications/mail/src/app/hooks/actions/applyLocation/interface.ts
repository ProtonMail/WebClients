import type { SPAM_ACTION } from '@proton/shared/lib/mail/mailSettings';

import type { SOURCE_ACTION } from '../../../components/list/list-telemetry/useListTelemetry';
import type { Element } from '../../../models/element';

export interface ApplyLocationParams {
    elements: Element[];
    destinationLabelID: string;
    removeLabel?: boolean;
    // This is used to avoid sending a unsubscribe request to a phishing email
    askUnsubscribe?: boolean;
    createFilters?: boolean;
    showSuccessNotification?: boolean;
    spamAction?: SPAM_ACTION;
}

export enum APPLY_LOCATION_TYPES {
    MOVE = 'MOVE',
    APPLY_LABEL = 'APPLY_LABEL',
    STAR = 'STAR',
}

export interface ApplyMultipleLocationsParams {
    elements: Element[];
    createFilters: boolean;
    changes: { [labelID: string]: boolean };
}

export interface ApplyLocationMoveProps extends ApplyLocationParams {
    type: APPLY_LOCATION_TYPES.MOVE;
}

export interface ApplyLocationLabelProps extends ApplyLocationParams {
    type: APPLY_LOCATION_TYPES.APPLY_LABEL;
    changes: { [labelID: string]: boolean };
}

export interface ApplyLocationStarProps extends ApplyLocationParams {
    type: APPLY_LOCATION_TYPES.STAR;
    /**
     * Where the user triggered the star from. Omitted by non-user callers (e.g. the Lumo
     * agent), and telemetry is only reported when it is present — so an automated star is
     * structurally excluded rather than filtered out downstream.
     */
    sourceAction?: SOURCE_ACTION;
}

export interface MoveParams {
    elements: Element[];
    destinationLabelID: string;
    sourceLabelID: string;
    createFilters?: boolean;
    selectAll?: boolean;
    onCheckAll?: (check: boolean) => void;
}
