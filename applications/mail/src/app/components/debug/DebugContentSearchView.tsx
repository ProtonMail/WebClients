import { useEffect, useState } from 'react';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import Progress from '@proton/components/components/progress/Progress';

import { ImportIssueSeverity } from 'proton-mail/helpers/contentSearchV2/import/Importer';
import { findEncryptedSearchIndexSize } from 'proton-mail/helpers/contentSearchV2/import/indexSize.ts';

import { useImporter } from './useImporter';

import './DebugContentSearchView.scss';

const severityClass = (severity: ImportIssueSeverity): string => {
    switch (severity) {
        case ImportIssueSeverity.Warning:
            return 'content-search-issue--warning';
        case ImportIssueSeverity.Error:
            return 'content-search-issue--error';
        case ImportIssueSeverity.Fatal:
            return 'content-search-issue--fatal';
    }
};

export function DebugContentSearchView() {
    const [user] = useUser();
    const { running, progress, issues, remainingMinutes, start, stop } = useImporter();
    const [oldIndexSize, setOldIndexSize] = useState<number | false | undefined>(undefined);

    useEffect(() => {
        findEncryptedSearchIndexSize(user.ID).then(
            (size) => {
                setOldIndexSize(size);
            },
            (err) => {
                console.error(err);
                setOldIndexSize(false);
            }
        );
    }, [user.ID]);

    if (oldIndexSize === undefined) {
        return null;
    }

    if (oldIndexSize === false) {
        return <div>Something went wrong, close the modal and try again.</div>;
    }

    return (
        <div className="flex flex-column flex-nowrap h-full min-h-0">
            <p className="my-2">
                Found a current encrypted search index with {oldIndexSize} messages.{' '}
                {running
                    ? "Import in progress, you can close this dialog while it's " +
                      "running and come back to it later. Don't close the tab though."
                    : 'You can import it as a new foundation-search index for development purposes.'}
            </p>
            {!running && (
                <div>
                    <Button size="small" onClick={() => start()}>
                        Import
                    </Button>
                </div>
            )}
            <div className="flex flex-column flex-nowrap flex-1 min-h-0">
                {running && (
                    <div className="flex flex-row flex-nowrap items-start gap-2">
                        <div className="flex-1 flex flex-column gap-4">
                            <Progress id="import-progress" max={100} value={progress} />
                            <label htmlFor="import-progress">{remainingMinutes} minutes remaining &hellip;</label>
                        </div>
                        <Button className="shrink-0" size="small" onClick={() => stop()}>
                            Cancel
                        </Button>
                    </div>
                )}
                {issues.length !== 0 && (
                    <section
                        aria-labelledby="import-issues-heading"
                        className="flex flex-column flex-nowrap flex-1 min-h-0"
                    >
                        <h3 id="import-issues-heading" className="mt-4 mb-2 text-rg text-bold">
                            {issues.length} issues during import:
                        </h3>
                        <ul className="m-0 unstyled flex-1 min-h-0 overflow-y-auto">
                            {issues.map((err, i) => (
                                <li
                                    key={i}
                                    className={`content-search-issue ${severityClass(err.severity)} flex flex-row flex-nowrap items-start gap-2 p-2`}
                                >
                                    <span className="flex-1 min-w-0">{err.message}</span>
                                    {err.id && (
                                        <span
                                            className="content-search-issue-id shrink-0 text-right text-ellipsis color-weak"
                                            title={err.id}
                                        >
                                            {err.id}
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>
        </div>
    );
}
