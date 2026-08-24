import { type FC, useMemo } from 'react';

import type { FieldProps } from 'formik';

import { useMemoSelector } from '../../hooks/useMemoSelector';
import { selectItemFilesForRevision } from '../../store/selectors/files';
import type { FileAttachmentValues, FileID, SelectedRevision } from '../../types';
import { prop } from '../../utils/fp/lens';
import { pipe } from '../../utils/fp/pipe';
import { notIn } from '../../utils/fp/predicates';
import { FileAttachmentsField } from './FileAttachmentsField';
import { FileAttachmentsList } from './FileAttachmentsList';

type Props = FieldProps<{}, FileAttachmentValues> & SelectedRevision;

export const FileAttachmentsFieldEdit: FC<Props> = (props) => {
    const { shareId, itemId, revision, form } = props;

    const filesForRevision = useMemoSelector(selectItemFilesForRevision, [shareId, itemId, revision]);
    const filesCount = filesForRevision.length;

    const files = useMemo(
        () => filesForRevision.filter(pipe(prop('fileID'), notIn(form.values.files.toRemove))),
        [filesForRevision, form.values.files.toRemove]
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
