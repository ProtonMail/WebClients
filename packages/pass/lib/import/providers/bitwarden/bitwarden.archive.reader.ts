import { truthy } from '../../../../utils/fp/predicates';
import { logger } from '../../../../utils/logger';
import { ImportProviderError } from '../../helpers/error';
import { readZIP } from '../../helpers/zip.reader';
import type { ImportReaderResult } from '../../types';
import { readBitwardenData } from './bitwarden.reader';

/** Process a Bitwarden archive (.zip). Required structure:
 * - /data.json
 * - /attachments/{uuid}/files */
export const readBitwardenArchiveData = async (file: File): Promise<ImportReaderResult> => {
    try {
        const fileReader = await readZIP(file);

        /** Extract directory list and identify root */
        const dirs = Array.from(fileReader.dirs);

        /** Map to store attachments by item UUID */
        const attachmentsDir = `attachments/`;
        const attachments = new Map<string, string[]>();

        dirs.forEach((path) => {
            if (path === attachmentsDir) return;
            if (!path.startsWith(attachmentsDir)) return;

            /** Extract UUID from path - skip nested folders */
            const [uuid, ...rest] = path.replace(attachmentsDir, '').split('/');
            if (rest.filter(truthy).length > 0) return;

            fileReader.files.forEach((file) => {
                if (file.startsWith(path)) {
                    const filesForUUID = attachments.get(uuid) ?? [];
                    filesForUUID.push(file);
                    attachments.set(uuid, filesForUUID);
                }
            });
        });

        /** Extract and process the main data file */
        const data = await fileReader.getFile(`data.json`);
        if (!data) throw new Error('Missing data.json');

        const extracted = new File([data], 'data.json');
        const result = await readBitwardenData(extracted, attachments);

        return { ...result, fileReader };
    } catch (e) {
        logger.warn('[Importer::Bitwarden::zip]', e);
        throw new ImportProviderError('Bitwarden', e);
    }
};
