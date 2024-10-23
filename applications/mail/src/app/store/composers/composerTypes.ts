import type { Optional, Recipient } from '@proton/shared/lib/interfaces';

import type { RecipientType } from '../../models/address';

type ComposerFields = {
    ID: string;
    messageID: string;
    senderEmailAddress: string;
    recipients: Record<RecipientType, Recipient[]>;
    /** TODO: Remove later. Used to trigger changes from a hook while moving to Redux */
    changesCount: number;
    forceOpenScheduleSend?: boolean;
    isMinimized: boolean;
    isMaximized: boolean;
};

/**
 * "loading" occurs when you open an existing message which is not yet loaded (for ex a draft)
 * "idle" occurs when Composer is ready
 */
type ComposerStatus = 'loading' | 'idle';

export type Composer =
    | ({
          status: Extract<ComposerStatus, 'loading'>;
      } & Optional<ComposerFields, 'senderEmailAddress'>)
    | ({
          status: Extract<ComposerStatus, 'idle'>;
      } & ComposerFields);

export type ComposerID = string;

export interface ComposersState {
    composers: Record<ComposerID, Composer>;
}
