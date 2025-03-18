import jszip from 'jszip';
import { c } from 'ttag';

import { ImportProviderError } from '@proton/pass/lib/import/helpers/error';
import { attachFilesToItem } from '@proton/pass/lib/import/helpers/files';
import { getImportedVaultName } from '@proton/pass/lib/import/helpers/transformers';
import {
    parse1PifData,
    processCreditCardItem,
    processIdentityItem,
    processLoginItem,
    processNoteItem,
    processPasswordItem,
} from '@proton/pass/lib/import/providers/1password/1pif.reader';
import type { ImportPayload, ImportVault } from '@proton/pass/lib/import/types';
import type { ItemImportIntent } from '@proton/pass/types';
import { first } from '@proton/pass/utils/array/first';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';

import { extract1PasswordLegacyFiles } from './1p.utils';
import { OnePassLegacyItemType } from './1pif.types';

const getFolderName = (filePath: string) => (filePath.includes('/') ? filePath : '');

export const read1PasswordZipData = async ({ data }: { data: ArrayBuffer }): Promise<ImportPayload> => {
    try {
        const zipFile = await jszip.loadAsync(data);
        const folderName = getFolderName(first(Object.keys(zipFile.files))!);
        const zipObject = zipFile.file(`${folderName}data.1pif`);
        const content = await zipObject?.async('string');

        if (!content) throw new Error('Unprocessable content');

        const ignored: string[] = [];
        const items: ItemImportIntent[] = (
            await Promise.all(
                parse1PifData(content).map(async (item) => {
                    const type = item?.typeName ?? c('Label').t`Unknown`;
                    const title = item?.title ?? '';
                    const files = await extract1PasswordLegacyFiles(zipFile, `${folderName}attachments/${item.uuid}`);

                    try {
                        switch (item.typeName) {
                            case OnePassLegacyItemType.LOGIN:
                                return attachFilesToItem(processLoginItem(item), files);
                            case OnePassLegacyItemType.NOTE:
                                return attachFilesToItem(processNoteItem(item), files);
                            case OnePassLegacyItemType.PASSWORD:
                                return attachFilesToItem(processPasswordItem(item), files);
                            case OnePassLegacyItemType.CREDIT_CARD:
                                return attachFilesToItem(processCreditCardItem(item), files);
                            case OnePassLegacyItemType.IDENTITY:
                                return attachFilesToItem(processIdentityItem(item), files);
                            default:
                                ignored.push(`[${type}] ${title}`);
                        }
                    } catch (err) {
                        ignored.push(`[${type}] ${title}`);
                        logger.warn('[Importer::1Password::1pif]', err);
                    }
                })
            )
        ).filter(truthy);

        const vaults: ImportVault[] = [
            {
                name: getImportedVaultName(),
                shareId: null,
                items: items,
            },
        ];

        return { vaults, ignored, warnings: [] };
    } catch (e) {
        logger.warn('[Importer::1Password::zip]', e);
        throw new ImportProviderError('1Password', e);
    }
};
