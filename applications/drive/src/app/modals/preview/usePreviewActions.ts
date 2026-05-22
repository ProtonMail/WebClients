import { type MaybeNode, MemberRole } from '@proton/drive';
import { isProtonDocsDocument, isProtonDocsSpreadsheet, isSupportedText } from '@proton/shared/lib/helpers/mimetype';
import { useFlag } from '@proton/unleash/useFlag';

import { downloadManager } from '../../modules/download/DownloadManager';
import { downloadDocument, getOpenInDocsInfo, openDocsOrSheetsDocument } from '../../utils/docs/openInDocs';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { bufferToStream } from '../../utils/stream';
import type { Drive } from './interface';
import { getNodeMimeType } from './nodeUtils';

export default function usePreviewActions({
    drive,
    nodeUid,
    node,
    nodeData,
    role,
}: {
    drive: Drive;
    nodeUid: string;
    node?: MaybeNode;
    nodeData?: Uint8Array<ArrayBuffer>[];
    role?: MemberRole;
}) {
    const isTextFileEditEnabled = useFlag('DriveWebTextFileEdit');
    const mimeType = getNodeMimeType(node);

    const downloadFile = !node
        ? undefined
        : async () => {
              if (mimeType && isProtonDocsDocument(mimeType)) {
                  await downloadDocument({
                      type: 'doc',
                      uid: nodeUid,
                  });
                  return;
              } else if (mimeType && isProtonDocsSpreadsheet(mimeType)) {
                  await downloadDocument({
                      type: 'sheet',
                      uid: nodeUid,
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

    const openInDocsType = mimeType ? getOpenInDocsInfo(mimeType) : undefined;

    const openInDocs = () => {
        if (!openInDocsType) {
            return;
        }

        void openDocsOrSheetsDocument({
            type: openInDocsType.type,
            isNative: openInDocsType.isNative,
            uid: nodeUid,
            openBehavior: 'tab',
        });
    };

    const saveFileEnabled =
        role !== MemberRole.Viewer &&
        isTextFileEditEnabled &&
        mimeType &&
        isSupportedText(mimeType) &&
        drive.getFileRevisionUploader;

    return {
        downloadFile,
        saveFile: saveFileEnabled ? saveFile : undefined,
        openInDocs: openInDocsType ? openInDocs : undefined,
    };
}
