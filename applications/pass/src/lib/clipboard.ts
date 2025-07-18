import { createClipboardService } from '@proton/pass/lib/clipboard/service';
import type { ClipboardApi } from '@proton/pass/lib/clipboard/types';
import { logger } from '@proton/pass/utils/logger';

export const clipboardApi: ClipboardApi = {
    read: async () => {
        // Navigator clipboard API, this is the default implementation
        // But it may fail if the window is not focused
        try {
            const result = await navigator.clipboard.readText();
            console.warn('Read', result);
            return result;
        } catch (error) {
            logger.debug('[Clipboard] Failed to read clipboard using navigator.clipboard');
        }

        // Legacy command API as a fallback
        const textareaElement = document.createElement('textarea');
        document.body.appendChild(textareaElement);
        textareaElement.focus();

        try {
            const pasteResult = document.execCommand('paste');
            const result = pasteResult ? textareaElement.value : '';
            console.warn('Legacy read', { pasteResult, result });
            return result;
        } catch {
            logger.debug('[Clipboard] Failed to read clipboard using legacy commands');
        } finally {
            // document.body.removeChild(textareaElement);
        }

        logger.error('[Clipboard] None clipboard read strategy worked');
        return '';
    },

    write: async (content: string) => {
        // Navigator clipboard API, this is the default implementation
        // But it may fail if the window is not focused
        try {
            console.warn('Write', content);
            return await navigator.clipboard.writeText(content);
        } catch (error) {
            logger.debug('[Clipboard] Failed to write clipboard using navigator.clipboard');
        }

        // Legacy command API as a fallback
        const textareaElement = document.createElement('textarea');
        textareaElement.textContent = !content ? ' ' : content;
        textareaElement.style.position = 'fixed';
        document.body.appendChild(textareaElement);
        textareaElement.select();

        try {
            console.warn('Legacy write', content, textareaElement.value);
            document.execCommand('copy');
            return;
        } catch (error) {
            logger.debug('[Clipboard] Failed to write clipboard using legacy commands');
        } finally {
            document.body.removeChild(textareaElement);
        }

        logger.error('[Clipboard] None clipboard write strategy worked');
    },
};

export const clipboard = createClipboardService(clipboardApi);
