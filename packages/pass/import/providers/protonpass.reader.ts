import JSZip from 'jszip';
import { c } from 'ttag';

import type { ExportPayload, ExportedItem } from '@proton/pass/export/types';
import { pageMessage, sendMessage } from '@proton/pass/extension/message';
import { type ItemImportIntent, ItemState, WorkerMessageType } from '@proton/pass/types';
import { partition } from '@proton/pass/utils/array';
import { prop } from '@proton/pass/utils/fp';
import { logger } from '@proton/pass/utils/logger';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

import { ImportProviderError, ImportReaderError } from '../helpers/error';
import type { ImportPayload, ImportVault } from '../types';

type ProtonPassReaderPayload =
    | { data: ArrayBuffer; encrypted: false; userId?: string }
    | { data: string; encrypted: true; passphrase: string; userId?: string };

export const readProtonPassData = async (payload: ProtonPassReaderPayload): Promise<ImportPayload> => {
    const zipBuffer = payload.encrypted
        ? /**
           * CryptoProxy is only initalized in the worker execution
           * context. Send a pageMessage (as of now the importer is
           * handled in the settings page) to decrypt the payload
           * before reading the .zip file contents
           */
          await (async () =>
              sendMessage.on(
                  pageMessage({
                      type: WorkerMessageType.EXPORT_DECRYPT,
                      payload: { data: payload.data, passphrase: payload.passphrase },
                  }),
                  (res) => {
                      if (res.type === 'error') {
                          const errorDetail = res.error.includes('Error decrypting message')
                              ? c('Error').t`Passphrase is incorrect`
                              : c('Error').t`File could not be parsed`;

                          throw new ImportReaderError(
                              c('Error').t`Decrypting your ${PASS_APP_NAME} export file failed. ${errorDetail}`
                          );
                      }

                      return base64StringToUint8Array(res.data);
                  }
              ))()
        : payload.data;

    try {
        const zipFile = await JSZip.loadAsync(zipBuffer);
        const zipObject = zipFile.file(`${PASS_APP_NAME}/data.json`);
        const exportData = await zipObject?.async('string');

        if (exportData === undefined) throw new Error();

        const parsedExport = JSON.parse(exportData) as ExportPayload;
        const { userId } = parsedExport;

        /* when trying to import alias items : make sure the userId between
         * the exported file and the current userId match. We won't be able
         * to re-create the aliases if they're not user-owned */
        const aliasOwnedByUser = (item: ExportedItem) =>
            item.data.type === 'alias' ? userId === payload.userId : true;

        const vaults = Object.values(parsedExport.vaults).map<{ vault: ImportVault; ignored: string[] }>(
            ({ name, items }) => {
                const [itemsToImport, ignoredAliases] = partition(items, aliasOwnedByUser);

                return {
                    vault: {
                        name: name,
                        shareId: null,
                        items: itemsToImport.map(
                            (item) =>
                                ({
                                    ...item.data,
                                    ...(item.data.type === 'alias'
                                        ? { extraData: { aliasEmail: item.aliasEmail! } }
                                        : {}),
                                    trashed: item.state === ItemState.Trashed,
                                    createTime: item.createTime,
                                    modifyTime: item.modifyTime,
                                } as ItemImportIntent)
                        ),
                    },
                    ignored: ignoredAliases.map((item) => `[Alias] ${item.aliasEmail}`),
                };
            }
        );

        return {
            vaults: vaults.map(prop('vault')),
            ignored: vaults.flatMap(prop('ignored')),
            warnings: [],
        };
    } catch (e) {
        logger.warn('[Importer::Proton]', e);
        throw new ImportProviderError(PASS_APP_NAME, e);
    }
};
