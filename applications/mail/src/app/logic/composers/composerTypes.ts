// import { DRAFT_MIME_TYPES } from '@proton/shared/lib/constants';

// import { RecipientOrGroup } from '../../models/address';

// type ComposerType = 'composer' | 'quick_reply' | 'eo';
// type ComposerSize = 'default' | 'maximized' | 'minimized';
/**
 * 'opening' | 'active' | 'blurred' => Composer is displayed in UI
 * 'closing' | 'sending' => Composer is hidden in UI
 */
// type ComposerStatus = 'opening' | 'active' | 'blurred' | 'closing' | 'sending';

// interface ComposerAttachment {
//     localID: string; // Not yet existing concept of local attachment id, could reuse cid perhaps
//     state: 'uploading' | 'uploaded';
//     progress: number;
// }

// interface Recipients {
//     cc: RecipientOrGroup[];
//     bcc: RecipientOrGroup[];
//     to: RecipientOrGroup[];
// }

export interface Composer {
    ID: string;
    messageID: string;
    /** Should contain everything returned by Rooster */
    // attachments: ComposerAttachment[];
    // body: string;
    // recipients: Recipients;
    // editorMode: DRAFT_MIME_TYPES;
    // pendingAutoSave: boolean; // document contains changes, debouncer is running
    // pendingSave: boolean; // a save request is pending
    /** Should only be used for ComposerClassic */
    // positionIndex: number;
    // senderAddressID: string;
    /** Should only be used for ComposerClassic */
    // size: ComposerSize;
    // status: ComposerStatus;
    // subject: string;
    // type: ComposerType;
}

export type ComposerID = string;

export interface ComposersState {
    composers: Record<ComposerID, Composer>;
}

// export type ComposerParams = Pick<Composer, 'senderAddressID' | 'size' | 'editorMode' | 'type'>;
// export type ComposerParamsWithMessageID = ComposerParams & Pick<Composer, 'messageID'>;
