import { isToday } from 'date-fns';
import { c } from 'ttag';

import type { Revision } from '@proton/drive';

import RevisionListItem from './RevisionListItem';
import type { CategorizedRevisions } from './getCategorizedRevisions';

interface Props {
    currentRevision: Revision;
    categorizedRevisions: CategorizedRevisions;
}

const RevisionList = ({ currentRevision, categorizedRevisions }: Props) => {
    const currentRevisionFormat = isToday(currentRevision.creationTime) ? 'time' : 'date';
    return (
        <ul className="unstyled">
            <li data-testid="current-revision">
                <span className="text-lg text-semibold revisions-modal-list-title--current">{c('Info')
                    .t`Current version`}</span>

                <ul className="unstyled my-4 ml-4">
                    <RevisionListItem formatType={currentRevisionFormat} revision={currentRevision} isCurrent />
                </ul>
            </li>
            {!!categorizedRevisions.size ? (
                <>
                    <li tabIndex={-1}>
                        <hr className="mb-5 revisions-modal-list-separator" />
                    </li>
                    {[...categorizedRevisions.entries()].map(([key, revisionCategory]) => {
                        return (
                            <li data-testid="previous-revisions" key={key}>
                                <span className="text-lg text-semibold color-weak">{revisionCategory.title}</span>
                                <ul className="unstyled my-3 ml-4">
                                    {revisionCategory.list.map((revision) => (
                                        <RevisionListItem
                                            key={revision.uid}
                                            formatType={key === 'today' || key === 'yesterday' ? 'time' : 'date'}
                                            revision={revision}
                                        />
                                    ))}
                                </ul>
                            </li>
                        );
                    })}
                </>
            ) : null}
        </ul>
    );
};

export default RevisionList;
