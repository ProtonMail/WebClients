import { useEffect, useState } from 'react';

import { c, msgid } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useGetUserKeys } from '@proton/account/userKeys/hooks';
import { Button } from '@proton/atoms/Button/Button';
import Progress from '@proton/components/components/progress/Progress';
import { IcCross } from '@proton/icons/icons/IcCross';

import type { DocLookupResult } from '../../contentSearch/devTools.ts';
import { getIndexByteSize, lookupDoc } from '../../contentSearch/devTools.ts';
import { ImportIssueSeverity } from '../../contentSearch/import/Import';
import { findEncryptedSearchIndexSize } from '../../contentSearch/import/indexSize.ts';
import { useImporter } from '../../contentSearch/import/useImporter';
import { logger } from '../../contentSearch/utils/logger.ts';

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

/**
 * Takes an equal share of the height it is given, with its title pinned and its body scrolling on
 * its own - two documents in one scroll container means comparing them is scrolling back and forth,
 * and the titles that say which is which are the first thing to go.
 */
function DocLookupRecord({ title, doc, emptyMessage }: { title: string; doc: unknown; emptyMessage: string }) {
    return (
        <section className="flex flex-column flex-nowrap flex-1 min-h-0">
            <h4 className="shrink-0 m-0 mb-1 text-sm text-bold color-weak">{title}</h4>
            {doc === undefined ? (
                <p className="m-0 color-weak">{emptyMessage}</p>
            ) : (
                <pre className="flex-1 min-h-0 overflow-y-auto text-sm text-pre-wrap m-0 p-2 bg-weak rounded">
                    {JSON.stringify(doc, null, 2)}
                </pre>
            )}
        </section>
    );
}

export function DebugContentSearchView() {
    const [user] = useUser();
    const { running, progress, issues, remainingMinutes, start, stop } = useImporter();
    const [oldIndexSize, setOldIndexSize] = useState<number | false | undefined>(undefined);
    const [lookup, setLookup] = useState<{ result?: DocLookupResult; error?: string } | undefined>(undefined);
    const getUserKeys = useGetUserKeys();

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
        return <div>{c('Error').t`Something went wrong, close the modal and try again.`}</div>;
    }

    return (
        <div className="flex flex-column flex-nowrap h-full min-h-0">
            <p className="my-2">
                {c('Info').ngettext(
                    msgid`Found a current encrypted search index with ${oldIndexSize} message.`,
                    `Found a current encrypted search index with ${oldIndexSize} messages.`,
                    oldIndexSize
                )}{' '}
                {running
                    ? c('Info')
                          .t`Import in progress, you can close this dialog while it's running and come back to it later. Don't close the tab though.`
                    : c('Info').t`You can import it as a new foundation-search index for development purposes.`}
            </p>
            {!running && (
                <div className="flex gap-2 my-2">
                    <Button
                        size="small"
                        onClick={() => {
                            setLookup(undefined);
                            void start();
                        }}
                    >
                        {c('Action').t`Import`}
                    </Button>
                    <Button
                        size="small"
                        onClick={async () => {
                            const id = prompt(c('Label').t`Document ID`);
                            if (id) {
                                try {
                                    const result = await lookupDoc(user, await getUserKeys(), id);
                                    logger.log(
                                        `document lookup for ${id}: foundation search: ${!!result.indexDoc}, ES store: ${!!result.sourceDoc}`
                                    );
                                    setLookup({ result });
                                } catch (err) {
                                    setLookup({ error: String(err) });
                                }
                            }
                        }}
                    >
                        {c('Action').t`Lookup document`}
                    </Button>
                    <Button
                        size="small"
                        onClick={async () => {
                            const size = await getIndexByteSize(user.ID);
                            logger.log('index size in bytes:', size);
                            alert(size);
                        }}
                    >
                        {c('Action').t`Get index size on disk`}
                    </Button>
                </div>
            )}
            {lookup && (
                <section aria-labelledby="doc-lookup-heading" className="flex flex-column flex-nowrap flex-1 min-h-0">
                    <header className="flex flex-row flex-nowrap items-center gap-2 mt-4 mb-2">
                        <h3 id="doc-lookup-heading" className="flex-1 min-w-0 m-0 text-rg text-bold text-ellipsis">
                            {lookup.result
                                ? c('Info').t`Lookup of document ${lookup.result.docId}`
                                : c('Info').t`Document lookup failed`}
                        </h3>
                        <Button
                            icon
                            size="small"
                            shape="ghost"
                            className="shrink-0"
                            title={c('Action').t`Dismiss`}
                            onClick={() => setLookup(undefined)}
                        >
                            <IcCross alt={c('Action').t`Dismiss`} />
                        </Button>
                    </header>
                    <div className="flex flex-column flex-nowrap flex-1 min-h-0 gap-2">
                        {lookup.error !== undefined && <p className="m-0 color-danger">{lookup.error}</p>}
                        {lookup.result && (
                            <>
                                <DocLookupRecord
                                    title={c('Info').t`Document in foundation-search index`}
                                    doc={lookup.result.indexDoc}
                                    emptyMessage={c('Info').t`Not found in the foundation-search index.`}
                                />
                                <DocLookupRecord
                                    title={c('Info').t`Source document in encrypted search index`}
                                    doc={lookup.result.sourceDoc}
                                    emptyMessage={c('Info').t`Not found in the encrypted search index.`}
                                />
                            </>
                        )}
                    </div>
                </section>
            )}
            {(running || issues.length !== 0) && (
                <div className="flex flex-column flex-nowrap flex-1 min-h-0">
                    {running && (
                        <div className="flex flex-row flex-nowrap items-start gap-2">
                            <div className="flex-1 flex flex-column gap-4">
                                <Progress id="import-progress" max={100} value={progress} />
                                <label htmlFor="import-progress">
                                    {c('Info').t`${remainingMinutes} minutes remaining…`}
                                </label>
                            </div>
                            <Button className="shrink-0" size="small" onClick={() => stop()}>
                                {c('Action').t`Cancel`}
                            </Button>
                        </div>
                    )}
                    {issues.length !== 0 && (
                        <section
                            aria-labelledby="import-issues-heading"
                            className="flex flex-column flex-nowrap flex-1 min-h-0"
                        >
                            <h3 id="import-issues-heading" className="mt-4 mb-2 text-rg text-bold">
                                {c('Info').ngettext(
                                    msgid`${issues.length} issue during import:`,
                                    `${issues.length} issues during import:`,
                                    issues.length
                                )}
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
            )}
        </div>
    );
}
