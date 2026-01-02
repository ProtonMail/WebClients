import type { MaybeNode } from '@proton/drive';
import {
    isProtonDocsDocument,
    isProtonDocsSpreadsheet,
    isSupportedText,
    mimeTypeToOpenInDocsType,
} from '@proton/shared/lib/helpers/mimetype';

import { useFlagsDriveSheetODSImport } from '../../flags/useFlagsDriveSheetODSImport';
import { downloadManager } from '../../managers/download/DownloadManager';
import { useDocumentActions } from '../../store/_documents';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { bufferToStream } from '../../utils/stream';
import type { Drive } from './interface';
import { getNodeMimeType } from './nodeUtils';

export default function usePreviewActions({
    drive,
    nodeUid,
    node,
    nodeData,
}: {
    drive: Drive;
    nodeUid: string;
    node?: MaybeNode;
    nodeData?: Uint8Array<ArrayBuffer>[];
}) {
    // TODO: Do not use legacy document actions - convert to new document actions.
    const { openDocumentWithNodeUid, convertDocumentWithNodeUid, downloadDocumentWithNodeUid } = useDocumentActions();

    const mimeType = getNodeMimeType(node);

    const downloadFile = !node
        ? undefined
        : async () => {
              if (mimeType && isProtonDocsDocument(mimeType)) {
                  await downloadDocumentWithNodeUid({
                      type: 'doc',
                      nodeUid,
                  });
                  return;
              } else if (mimeType && isProtonDocsSpreadsheet(mimeType)) {
                  await downloadDocumentWithNodeUid({
                      type: 'sheet',
                      nodeUid,
                  });
                  return;
              }

              // TODO: Add support for Live photos and Burst (related photos)
              // In case we have related photos we should use the standard download
              if (nodeData) {
                  const { node: nodeEntity } = getNodeEntity(node);
                  await downloadManager.downloadFromBuffer(nodeEntity, nodeData, mimeType);
                  return;
              }

              await downloadManager.download([nodeUid]);
          };

    const saveFile = async (content: Uint8Array<ArrayBuffer>[]) => {
        if (!drive.getFileRevisionUploader || !node) {
            return;
        }

        const expectedSize = content.reduce((acc, curr) => acc + curr.byteLength, 0);

        const uploader = await drive.getFileRevisionUploader(nodeUid, {
            mediaType: mimeType ?? 'application/octet-stream',
            expectedSize,
            modificationTime: new Date(),
        });

        const uploadController = await uploader.uploadFromStream(bufferToStream(content), []);
        await uploadController.completion();
    };

    const isODSImportEnabled = useFlagsDriveSheetODSImport();
    const openInDocsType = node ? mimeTypeToOpenInDocsType(mimeType, isODSImportEnabled) : undefined;

    const openInDocs = () => {
        if (!openInDocsType) {
            return;
        }

        const type: 'doc' | 'sheet' = {
            document: 'doc' as const,
            spreadsheet: 'sheet' as const,
        }[openInDocsType.type];

        if (openInDocsType.isNative) {
            void openDocumentWithNodeUid({
                type,
                nodeUid,
            });
        } else {
            void convertDocumentWithNodeUid({
                type,
                nodeUid,
            });
        }
    };

    return {
        downloadFile,
        saveFile: mimeType && isSupportedText(mimeType) && drive.getFileRevisionUploader ? saveFile : undefined,
        openInDocs: openInDocsType ? openInDocs : undefined,
    };
}
