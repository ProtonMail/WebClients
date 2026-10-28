import type { MessageMetadata } from '@proton/shared/lib/interfaces/mail/Message';
import type { Optional } from '@proton/shared/lib/interfaces/utils';

export type ComposerRecipients = Pick<MessageMetadata, 'ToList' | 'CCList' | 'BCCList'>;

type ComposerFields = {
    ID: string;
    messageID: string;
    senderEmailAddress: string;
    recipients: ComposerRecipients;
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
    hasFocusedComposer: boolean;
}

/** The part of the host application's store that holds the composers slice. */
export interface ComposersStoreState {
    composers: ComposersState;
}
