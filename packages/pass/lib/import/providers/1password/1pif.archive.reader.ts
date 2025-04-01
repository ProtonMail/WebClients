import { ImportProviderError } from '@proton/pass/lib/import/helpers/error';
import { readZIP } from '@proton/pass/lib/import/helpers/zip.reader';
import { read1Password1PifData } from '@proton/pass/lib/import/providers/1password/1pif.reader';
import type { ImportReaderResult } from '@proton/pass/lib/import/types';
import { first } from '@proton/pass/utils/array/first';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';

/** Process a 1Password 1PIF archive (.zip) :
 * - Expects user to zip the exported folder as-is
 * - Required structure: root/data.1pif and root/attachments/{uuid}/files */
export const read1Password1PifArchiveData = async (file: File): Promise<ImportReaderResult> => {
    try {
        const fileReader = await readZIP(file);

        /** Extract directory list and identify root */
        const dirs = Array.from(fileReader.dirs);
        const root = first(dirs);
        if (!root) throw new Error('Invalid archive');

        /** Map to store attachments by item UUID */
        const attachmentsDir = `${root}attachments/`;
        const attachments = new Map<string, string[]>();

        dirs.forEach((path) => {
            if (path === attachmentsDir) return;
            if (!path.startsWith(attachmentsDir)) return;

            /** Extract UUID from path - skip nested folders */
            const [uuid, ...rest] = path.replace(attachmentsDir, '').split('/');
            if (rest.filter(truthy).length > 0) return false;

            fileReader.files.forEach((file) => {
                if (file.startsWith(path)) {
                    const filesForUUID = attachments.get(uuid) ?? [];
                    filesForUUID.push(file);
                    attachments.set(uuid, filesForUUID);
                }
            });
        });

        /** Extract and process the main data file */
        const data = await fileReader.getFile(`${root}data.1pif`);
        if (!data) throw new Error('Missing data.1pif');

        const extracted = new File([data], 'data.json');
        const result = await read1Password1PifData(extracted, attachments);

        return { ...result, fileReader };
    } catch (e) {
        logger.warn('[Importer::1Password::1pif]', e);
        throw new ImportProviderError('1Password', e);
    }
};
