import type { SPAM_ACTION } from '@proton/shared/lib/mail/mailSettings';

import type { Element } from 'proton-mail/models/element';

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

export interface ApplyLocationMoveProps extends ApplyLocationParams {
    type: APPLY_LOCATION_TYPES.MOVE;
}

export interface ApplyLocationLabelProps extends ApplyLocationParams {
    type: APPLY_LOCATION_TYPES.APPLY_LABEL;
    changes: { [labelID: string]: boolean };
}

export interface ApplyLocationStarProps extends ApplyLocationParams {
    type: APPLY_LOCATION_TYPES.STAR;
}
