import { useCallback } from 'react';

import { GUEST_MIGRATION_STORAGE_KEYS } from '../constants/guestMigration';
import { useConversation } from '../providers/ConversationProvider';
import { useLumoSelector } from '../redux/hooks';
import {
    selectAttachmentsBySpaceId,
    selectConversationById,
    selectMessagesByConversationId,
    selectSpaceByConversationId,
} from '../redux/selectors';
import type { AttachmentMap } from '../redux/slices/core/attachments';
import type { MessageMap } from '../redux/slices/core/messages';
import type { Conversation, ConversationId, Space } from '../types';
import { clearGuestEncryptionKey, decryptGuestData, encryptGuestData } from '../utils/guestEncryption';

export interface GuestMigrationData {
    conversation: Conversation | undefined;
    messages: MessageMap;
    attachments: AttachmentMap;
    // spaces: SpaceMap;
    space: Space | undefined;
    activeConversationId?: ConversationId;
    timestamp: number;
}

export const useGuestMigration = () => {
    const { conversationId } = useConversation();

    // Always call hooks in the same order - use null/undefined selectors when no conversationId
    const conversation = useLumoSelector(conversationId ? selectConversationById(conversationId) : () => undefined);
    const space = useLumoSelector(conversationId ? selectSpaceByConversationId(conversationId) : () => undefined);
    const messagesByConversationId = useLumoSelector(
        conversationId ? selectMessagesByConversationId(conversationId) : () => ({})
    );
    const attachmentsBySpaceId = useLumoSelector(space?.id ? selectAttachmentsBySpaceId(space.id) : () => ({}));
    // const attachments = useLumoSelector(selectAttachments);
    // const conversations = useLumoSelector(selectConversations);

    const captureGuestState = useCallback(async () => {
        // Don't capture if no conversation
        if (!conversationId || !conversation) {
            console.log('No active conversation to capture');
            return false;
        }

        const migrationData: GuestMigrationData = {
            conversation,
            messages: messagesByConversationId,
            attachments: attachmentsBySpaceId,
            space,
            activeConversationId: conversationId,
            timestamp: Date.now(),
        };

        try {
            // Encrypt the data before storing
            const encryptedData = await encryptGuestData(migrationData);
            localStorage.setItem(GUEST_MIGRATION_STORAGE_KEYS.MIGRATION_DATA, encryptedData);

            console.log('Guest state captured and encrypted for migration:', {
                conversation: conversation?.id,
                space: space?.id,
                messages: Object.keys(messagesByConversationId).length,
                attachments: Object.keys(attachmentsBySpaceId).length,
                activeConversationId: conversationId,
            });
            return true;
        } catch (error) {
            console.error('Failed to capture guest state:', error);
            return false;
        }
    }, [conversation, messagesByConversationId, attachmentsBySpaceId, space, conversationId]);

    const clearGuestState = useCallback(() => {
        localStorage.removeItem(GUEST_MIGRATION_STORAGE_KEYS.MIGRATION_DATA);
        clearGuestEncryptionKey();
    }, []);

    const getStoredGuestState = useCallback(async (): Promise<GuestMigrationData | null> => {
        try {
            const stored = localStorage.getItem(GUEST_MIGRATION_STORAGE_KEYS.MIGRATION_DATA);
            if (!stored) return null;

            // Decrypt the stored data
            return await decryptGuestData(stored);
        } catch (error) {
            console.error('Failed to retrieve guest state:', error);
            // If decryption fails, clean up the corrupted data
            localStorage.removeItem(GUEST_MIGRATION_STORAGE_KEYS.MIGRATION_DATA);
            clearGuestEncryptionKey();
            return null;
        }
    }, []);

    const hasStoredGuestState = useCallback((): boolean => {
        try {
            return localStorage.getItem(GUEST_MIGRATION_STORAGE_KEYS.MIGRATION_DATA) !== null;
        } catch (error) {
            console.warn('Failed to check for stored guest state:', error);
            return false;
        }
    }, []);

    return {
        captureGuestState,
        clearGuestState,
        getStoredGuestState,
        hasStoredGuestState,
    };
};
