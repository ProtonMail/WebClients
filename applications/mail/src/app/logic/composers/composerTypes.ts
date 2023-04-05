import { Recipient } from '@proton/shared/lib/interfaces';

import { EditorTypes } from '../../hooks/composer/useComposerContent';
import { RecipientType } from '../../models/address';

export interface Composer {
    ID: string;
    messageID: string;
    senderEmailAddress: string;
    recipients: Record<RecipientType, Recipient[]>;
    /** TODO: Remove later. Used to trigger changes from a hook while moving to Redux */
    changesCount: number;
    type: EditorTypes;
}

export type ComposerID = string;

export interface ComposersState {
    composers: Record<ComposerID, Composer>;
}
