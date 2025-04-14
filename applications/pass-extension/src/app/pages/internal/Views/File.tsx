import { type FC, useEffect, useMemo } from 'react';
import type { RouteComponentProps } from 'react-router-dom';

import { ExtensionHead } from 'proton-pass-extension/lib/components/Extension/ExtensionHead';
import { c } from 'ttag';

import { FileAttachmentIcon } from '@proton/pass/components/FileAttachments/FileAttachmentIcon';
import type { FileParam } from '@proton/pass/lib/file-attachments/helpers';
import { intoFileRef, mimetypeForDownload } from '@proton/pass/lib/file-attachments/helpers';
import { fileStorage } from '@proton/pass/lib/file-storage/fs';
import { download } from '@proton/pass/utils/dom/download';
import { safeCall } from '@proton/pass/utils/fp/safe-call';

import { AutoClose } from './AutoClose';

export const File: FC<RouteComponentProps<FileParam>> =
    BUILD_TARGET === 'safari'
        ? ({ match: { params } }) => {
              const ref = useMemo(
                  safeCall(() => intoFileRef(params.file)),
                  []
              );

              useEffect(() => {
                  const doDownload = async () => {
                      if (!ref) throw new Error('Invalid file');
                      if (fileStorage.type === 'Memory') throw new Error('Invalid storage');

                      const mimeType = mimetypeForDownload(ref.mimeType);
                      const file = await fileStorage.readFile(ref.ref, mimeType);
                      if (!file) throw new Error('File not found');

                      download(file, ref.filename);
                  };

                  doDownload().catch(() => window.close());
              }, []);

              if (!ref) return null;
              const { filename, mimeType } = ref;

              return (
                  ref && (
                      <div className="pass-lobby max-h-full max-w-full flex flex-column justify-center flex-1 p-4">
                          <ExtensionHead title={c('Pass_file_attachments').t`Download "${filename}"`} />
                          <div className="flex flex-column gap-3 items-center text-center">
                              <FileAttachmentIcon mimeType={mimeType} size={8} />
                              <strong>{filename}</strong>
                              <em className="text-sm">{c('Pass_file_attachments')
                                  .t`You may close this window after saving the file.`}</em>
                          </div>
                      </div>
                  )
              );
          }
        : AutoClose;
