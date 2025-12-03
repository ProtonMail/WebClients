import type { MaybeNode } from '@proton/drive';
import { useDrive } from '@proton/drive';
import {
    isProtonDocsDocument,
    isProtonDocsSpreadsheet,
    mimeTypeToOpenInDocsType,
} from '@proton/shared/lib/helpers/mimetype';

import { downloadManager } from '../../managers/download/DownloadManager';
import { useDocumentActions } from '../../store/_documents';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { bufferToStream } from '../../utils/stream';
import { getNodeMimeType } from './nodeUtils';

export default function usePreviewActions({
    nodeUid,
    node,
    nodeData,
}: {
    nodeUid: string;
    node?: MaybeNode;
    nodeData?: Uint8Array<ArrayBuffer>[];
}) {
    const { drive } = useDrive();

    // TODO: Do not use legacy document actions - convert to new document actions.
    const { openDocumentWithNodeUid, convertDocumentWithNodeUid, downloadDocumentWithNodeUid } = useDocumentActions();

    const downloadFile = !node
        ? undefined
        : async () => {
              const mimeType = getNodeMimeType(node);
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
                  await downloadManager.downloadFromBuffer(nodeEntity, nodeData, getNodeMimeType(node));
                  return;
              }

              await downloadManager.download([nodeUid]);
          };

    const saveFile = async (content: Uint8Array<ArrayBuffer>[]) => {
        if (!node) {
            return;
        }

        const expectedSize = content.reduce((acc, curr) => acc + curr.byteLength, 0);

        const uploader = await drive.getFileRevisionUploader(nodeUid, {
            mediaType: getNodeMimeType(node) ?? 'application/octet-stream',
            expectedSize,
            modificationTime: new Date(),
        });

        const uploadController = await uploader.uploadFromStream(bufferToStream(content), []);
        await uploadController.completion();
    };

    const openInDocsType = node ? mimeTypeToOpenInDocsType(getNodeMimeType(node)) : undefined;
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
        saveFile,
        openInDocs: openInDocsType ? openInDocs : undefined,
    };
}
