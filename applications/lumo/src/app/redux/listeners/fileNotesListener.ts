import { isAnyOf } from '@reduxjs/toolkit';

import { signoutAction } from '@proton/account/authenticationService/authenticationListener';

import { forgetFileNotes } from '../../features/client-tools/retrievalTool/prefetchAnalysis';
import { deleteAllAttachments, deleteAttachment } from '../slices/core/attachments';
import { deleteAllConversations, deleteConversation } from '../slices/core/conversations';
import type { AppStartListening } from '../store';

/**
 * The notes taken on the user's files are decrypted text kept in memory: they must not outlive
 * the session, or the files and chats they came from.
 */
export function startFileNotesListeners(startListening: AppStartListening) {
    startListening({
        matcher: isAnyOf(signoutAction, deleteAllAttachments, deleteAllConversations),
        effect: () => forgetFileNotes(),
    });
    startListening({
        matcher: isAnyOf(deleteAttachment, deleteConversation),
        effect: (_action, { getState }) => {
            const { attachments } = getState();
            forgetFileNotes((fileId) => fileId in attachments);
        },
    });
}
