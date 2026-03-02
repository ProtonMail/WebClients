import type { DBType } from '../interface';

interface AllContentHasVersionProps {
    esDB: DBType;
}

/**
 * Check that all the content has a version extracted alongside the encrypted content.
 */
export const allContentHasVersion = async ({ esDB }: AllContentHasVersionProps): Promise<boolean> => {
    const tx = esDB.transaction(['content'], 'readonly');
    const contentStore = tx.objectStore('content');

    try {
        let cursor = await contentStore.openCursor();
        while (cursor) {
            const content = cursor.value;
            if (!content.version || content.version < 1) {
                return false;
            }
            cursor = await cursor.continue();
        }

        return true;
    } catch (error) {
        return false;
    } finally {
        await tx.done;
    }
};
