import { type FC, useMemo } from 'react';

import type { FieldProps } from 'formik';

import { useMemoSelector } from '@proton/pass/hooks/useMemoSelector';
import { isCustomIconFile } from '@proton/pass/lib/file-attachments/custom-icon';
import { selectItemFilesForRevision } from '@proton/pass/store/selectors/files';
import type { FileAttachmentValues, FileID, SelectedRevision } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { notIn } from '@proton/pass/utils/fp/predicates';

import { FileAttachmentsField } from './FileAttachmentsField';
import { FileAttachmentsList } from './FileAttachmentsList';

type Props = FieldProps<{}, FileAttachmentValues> & SelectedRevision;

export const FileAttachmentsFieldEdit: FC<Props> = (props) => {
    const { shareId, itemId, revision, form } = props;

    const filesForRevision = useMemoSelector(selectItemFilesForRevision, [shareId, itemId, revision]);

    /** Filter out custom icon files — they are managed by CustomIconField */
    const regularFiles = useMemo(
        () => filesForRevision.filter((f) => !isCustomIconFile(f.name)),
        [filesForRevision]
    );
    const filesCount = regularFiles.length;

    const files = useMemo(
        () => regularFiles.filter(pipe(prop('fileID'), notIn(form.values.files.toRemove))),
        [regularFiles, form.values.files.toRemove]
    );

    const handleFileDelete = (fileID: FileID) =>
        form.setFieldValue('files.toRemove', form.values.files.toRemove.concat(fileID));

    const handleDeleteAllFiles = () =>
        form.setFieldValue('files.toRemove', form.values.files.toRemove.concat(files.map(prop('fileID'))));

    return (
        <FileAttachmentsField
            {...props}
            filesCount={Math.max(0, filesCount - form.values.files.toRemove.length)}
            onDeleteAllFiles={handleDeleteAllFiles}
        >
            <FileAttachmentsList
                canRename
                files={files}
                itemId={itemId}
                onDelete={handleFileDelete}
                shareId={shareId}
            />
        </FileAttachmentsField>
    );
};
