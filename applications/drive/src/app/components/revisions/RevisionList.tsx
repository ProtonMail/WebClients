import { c } from 'ttag';

import { DriveFileRevision } from '@proton/shared/lib/interfaces/drive/file';

import type { CategorizedRevisions } from '../modals/RevisionsModal/getCategorizedRevisions';
import RevisionListItem from './RevisionListItem';

interface Props {
    currentRevision: DriveFileRevision;
    categorizedRevisions: CategorizedRevisions;
    havePreviewAvailable: boolean;
}

const revisionListFromArray = (
    revisionCategoryList: DriveFileRevision[],
    havePreviewAvailable: boolean,
    formatType?: 'date' | 'time'
) => {
    return (
        <ul className="unstyled my-4 ml-4">
            {revisionCategoryList.map((revision) => (
                <RevisionListItem
                    key={revision.ID}
                    revisionId={revision.ID}
                    havePreviewAvailable={havePreviewAvailable}
                    formatType={formatType}
                    createTime={revision.CreateTime}
                />
            ))}
        </ul>
    );
};

const RevisionList = ({ currentRevision, categorizedRevisions, havePreviewAvailable }: Props) => {
    return (
        <ul className="unstyled">
            <li>
                <span className="text-lg text-semibold revisions-modal-list-title--current">{c('Info')
                    .t`Current version`}</span>

                <ul className="unstyled my-4 ml-4">
                    <RevisionListItem
                        revisionId={currentRevision.ID}
                        havePreviewAvailable={havePreviewAvailable}
                        formatType="time"
                        createTime={currentRevision.CreateTime}
                        isCurrent
                    />
                </ul>
            </li>
            {!!categorizedRevisions.size ? (
                <>
                    <li tabIndex={-1}>
                        <hr className="mb-5 revisions-modal-list-separator" />
                    </li>
                    {[...categorizedRevisions.entries()].map(([key, revisionCategory]) => {
                        return (
                            <li key={key}>
                                <span className="text-lg text-semibold color-weak">{revisionCategory.title}</span>
                                {revisionListFromArray(
                                    revisionCategory.list,
                                    havePreviewAvailable,
                                    key === 'today' || key === 'yesterday' ? 'time' : 'date'
                                )}
                            </li>
                        );
                    })}
                </>
            ) : null}
        </ul>
    );
};

export default RevisionList;
