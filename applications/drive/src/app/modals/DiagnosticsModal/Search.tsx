import { useEffect, useState } from 'react';

import { openDB } from 'idb';
import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import {
    Checkbox,
    ModalTwo,
    ModalTwoContent,
    ModalTwoHeader,
    Row,
    Table,
    TableBody,
    TableHeader,
    TableRow,
    Tabs,
    useModalState,
} from '@proton/components';
import Icon from '@proton/components/components/icon/Icon';
import type { Entry } from '@proton/proton-foundation-search';
import init, {
    ExportEventKind,
    Engine as SearchLibraryWasmEngine,
    SerDes,
    WriteEventKind,
} from '@proton/proton-foundation-search';
import type { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { SORT_DIRECTION as SORT } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';

import type { UseSearchModuleReturn } from '../../hooks/search/useSearchModule';
import { useSearchModule } from '../../hooks/search/useSearchModule';
import { IndexKind } from '../../modules/search';
import type { IndexPopulatorState } from '../../modules/search/internal/shared/SearchDB';

const ALL_INDEX_KINDS = Object.values(IndexKind);

// --- Helpers ---

function attr(entry: ExportedEntry, name: string): string {
    const values = entry.attributes[name];
    if (!values || values.length === 0) {
        return '';
    }
    return String(values[0]);
}

function formatTime(raw: string): string {
    if (!raw) {
        return '';
    }
    const ms = Number(raw);
    if (Number.isNaN(ms)) {
        return raw;
    }
    return new Date(ms).toLocaleString();
}

// --- Export / Remove logic ---

type ExportedEntry = {
    identifier: string;
    attributes: Record<string, unknown[]>;
};

function serializeEntry(entry: Entry): ExportedEntry {
    const attributes: Record<string, unknown[]> = {};
    for (const name of entry.attributes()) {
        attributes[name] = entry.attribute(name).map((v) => v.value());
    }
    return { identifier: entry.identifier(), attributes };
}

async function openSearchDB(userId: string) {
    return openDB(`search:${userId}`, 1);
}

type ExportResult = {
    entries: ExportedEntry[];
    sizeBytes: number;
};

async function exportIndex(userId: string, kind: IndexKind): Promise<ExportResult> {
    await init();

    const db = await openSearchDB(userId);
    const engine = SearchLibraryWasmEngine.builder().build();

    try {
        const exp = engine.export();
        const entries: ExportedEntry[] = [];
        let sizeBytes = 0;

        try {
            let event = exp.next();
            while (event) {
                switch (event.kind()) {
                    case ExportEventKind.Load: {
                        const blobName = event.id().toString();
                        const data = await db.get('indexBlobs', [kind, blobName]);
                        if (data) {
                            sizeBytes += (data as ArrayBuffer).byteLength;
                            event.send(SerDes.Cbor, new Uint8Array(data));
                        } else {
                            event.sendEmpty();
                        }
                        break;
                    }
                    case ExportEventKind.Entry: {
                        const entry = event.entry();
                        if (entry) {
                            entries.push(serializeEntry(entry));
                            entry.free();
                        }
                        break;
                    }
                    default:
                        event.free();
                        break;
                }
                event = exp.next();
            }
        } finally {
            exp.free();
        }

        return { entries, sizeBytes };
    } finally {
        engine.free();
        db.close();
    }
}

async function removeFromIndex(userId: string, kind: IndexKind, identifier: string): Promise<void> {
    await init();

    const db = await openSearchDB(userId);
    const engine = SearchLibraryWasmEngine.builder().build();

    try {
        const writer = engine.write();
        if (!writer) {
            throw new Error('Failed to acquire write handle');
        }
        writer.remove(identifier);
        const execution = writer.commit();

        try {
            let event = execution.next();
            while (event) {
                switch (event.kind()) {
                    case WriteEventKind.Load: {
                        const blobName = event.id().toString();
                        const data = await db.get('indexBlobs', [kind, blobName]);
                        if (data) {
                            event.send(SerDes.Cbor, new Uint8Array(data));
                        } else {
                            event.sendEmpty();
                        }
                        break;
                    }
                    case WriteEventKind.Save: {
                        const blobName = event.id().toString();
                        const cached = event.recv();
                        const data = cached.serialize(SerDes.Cbor);
                        await db.put('indexBlobs', data.buffer as ArrayBuffer, [kind, blobName]);
                        break;
                    }
                    default:
                        event.free();
                        break;
                }
                event = execution.next();
            }
        } finally {
            execution.free();
        }
    } finally {
        engine.free();
        db.close();
    }
}

// --- Populator states ---

function PopulatorStates({ searchModule }: { searchModule: Extract<UseSearchModuleReturn, { isAvailable: true }> }) {
    const [user] = useUser();
    const [states, setStates] = useState<IndexPopulatorState[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStates = async () => {
        setLoading(true);
        try {
            const db = await openSearchDB(user.ID);
            try {
                const all = await db.getAll('indexPopulatorStates');
                setStates(all as IndexPopulatorState[]);
            } finally {
                db.close();
            }
        } catch {
            setStates([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        void fetchStates();
    }, [user.ID]);

    const handleReindex = async (uid: string) => {
        await searchModule.reindexPopulator(uid);
        void fetchStates();
    };

    if (loading) {
        return <CircleLoader />;
    }

    if (states.length === 0) {
        return <p>{c('Info').t`No populator states found.`}</p>;
    }

    return (
        <Table>
            <TableHeader>
                <tr>
                    <th style={{ width: '80em' }}>UID</th>
                    <th style={{ width: '5em' }}>Done</th>
                    <th style={{ width: '8em' }}>Generation</th>
                    <th style={{ width: '6em' }}>Version</th>
                    <th style={{ width: '8em' }}>{c('Title').t`Actions`}</th>
                </tr>
            </TableHeader>
            <TableBody>
                {states.map((s) => (
                    <TableRow
                        key={s.uid}
                        cells={[
                            <code key="uid">{s.uid}</code>,
                            <span key="done">{s.done ? 'Yes' : 'No'}</span>,
                            <span key="gen">{s.generation}</span>,
                            <span key="ver">{s.version}</span>,
                            <Button
                                key="action"
                                size="small"
                                onClick={() => {
                                    void handleReindex(s.uid);
                                }}
                            >{c('Action').t`Re-index`}</Button>,
                        ]}
                    />
                ))}
            </TableBody>
        </Table>
    );
}

// --- Global tab ---

function SearchGlobal() {
    const searchModule = useSearchModule();

    if (!searchModule.isAvailable) {
        return <p>{c('Info').t`Search module is not available.`}</p>;
    }

    return (
        <>
            <InfoRow label={c('Label').t`User opted in`} value={searchModule.isUserOptIn ? 'Yes' : 'No'} />
            <InfoRow label={c('Label').t`Searchable`} value={searchModule.isSearchable ? 'Yes' : 'No'} />
            <InfoRow label={c('Label').t`Initial indexing`} value={searchModule.isInitialIndexing ? 'Yes' : 'No'} />
            <InfoRow
                label={c('Label').t`Outdated version`}
                value={searchModule.isRunningOutdatedVersion ? 'Yes' : 'No'}
            />
            <InfoRow
                label={c('Label').t`Environment compatible`}
                value={typeof SharedWorker !== 'undefined' && typeof indexedDB !== 'undefined' ? 'Yes' : 'No'}
            />
            <InfoRow label={c('Label').t`Index kinds`} value={ALL_INDEX_KINDS.join(', ')} />

            <h3 className="text-bold mt-4 mb-2">{c('Title').t`Index populators`}</h3>
            <PopulatorStates searchModule={searchModule} />
        </>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <Row>
            <span className="label cursor-default">{label}</span>
            <div className="pt-2">
                <b>{value}</b>
            </div>
        </Row>
    );
}

// --- Index tab ---

type IndexExportState = {
    loading: boolean;
    result?: ExportResult;
    error?: string;
};

function SearchIndex({ kind }: { kind: IndexKind }) {
    const [user] = useUser();
    const [state, setState] = useState<IndexExportState>({ loading: true });

    const fetchIndex = async () => {
        setState({ loading: true });
        try {
            const result = await exportIndex(user.ID, kind);
            setState({ loading: false, result });
        } catch (error) {
            setState({ loading: false, error: error instanceof Error ? error.message : `${error}` });
            console.error(error);
        }
    };

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            try {
                const result = await exportIndex(user.ID, kind);
                if (!cancelled) {
                    setState({ loading: false, result });
                }
            } catch (error) {
                if (!cancelled) {
                    setState({ loading: false, error: error instanceof Error ? error.message : `${error}` });
                    console.error(error);
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [user.ID, kind]);

    const handleRemove = async (identifier: string) => {
        try {
            await removeFromIndex(user.ID, kind, identifier);
            setState((prev) => ({
                ...prev,
                result: prev.result
                    ? { ...prev.result, entries: prev.result.entries.filter((e) => e.identifier !== identifier) }
                    : undefined,
            }));
        } catch (error) {
            console.error(error);
        }
    };

    if (state.loading) {
        return <CircleLoader />;
    }

    return (
        <>
            <div className="flex items-center justify-between mb-2">
                {state.result && (
                    <span>
                        {c('Info').t`${state.result.entries.length} entries`} —{' '}
                        {humanSize({ bytes: state.result.sizeBytes })}
                    </span>
                )}
                <Button
                    className="ml-8"
                    size="small"
                    onClick={() => {
                        void fetchIndex();
                    }}
                >{c('Action').t`Refetch index`}</Button>
            </div>

            {state.error && <p className="color-danger">{state.error}</p>}

            {state.result && <IndexExportTable entries={state.result.entries} onRemove={handleRemove} />}
        </>
    );
}

// --- Column definitions ---

type SortConfig = {
    key: string;
    direction: SORT_DIRECTION;
};

type ColumnDef = {
    key: string;
    label: string;
    width?: string;
    render: (entry: ExportedEntry) => React.ReactNode;
    sortValue: (entry: ExportedEntry) => string | number;
    defaultVisible: boolean;
};

const COLUMNS: ColumnDef[] = [
    {
        key: 'filename',
        label: 'filename',
        defaultVisible: true,
        sortValue: (e) => attr(e, 'filename'),
        render: (entry) => attr(entry, 'filename'),
    },
    {
        key: 'path',
        label: 'path',
        defaultVisible: true,
        sortValue: (e) => attr(e, 'path'),
        render: (entry) => attr(entry, 'path'),
    },
    {
        key: 'nodeUid',
        label: 'nodeUid',
        width: '32em',
        defaultVisible: false,
        sortValue: (e) => attr(e, 'nodeUid'),
        render: (entry) => (
            <code className="text-ellipsis block overflow-hidden" title={attr(entry, 'nodeUid')}>
                {attr(entry, 'nodeUid')}
            </code>
        ),
    },
    {
        key: 'treeEventScopeId',
        label: 'treeEventScopeId',
        width: '32em',
        defaultVisible: false,
        sortValue: (e) => attr(e, 'treeEventScopeId'),
        render: (entry) => (
            <code className="text-ellipsis block overflow-hidden" title={attr(entry, 'treeEventScopeId')}>
                {attr(entry, 'treeEventScopeId')}
            </code>
        ),
    },
    {
        key: 'nodeType',
        label: 'nodeType',
        width: '8em',
        defaultVisible: false,
        sortValue: (e) => attr(e, 'nodeType'),
        render: (entry) => attr(entry, 'nodeType'),
    },
    {
        key: 'indexPopulatorId',
        label: 'Populator ID',
        width: '10em',
        defaultVisible: true,
        sortValue: (e) => attr(e, 'indexPopulatorId'),
        render: (entry) => attr(entry, 'indexPopulatorId'),
    },
    {
        key: 'indexPopulatorGeneration',
        label: 'Populator Generation',
        width: '8em',
        defaultVisible: true,
        sortValue: (e) => Number(attr(e, 'indexPopulatorGeneration')),
        render: (entry) => attr(entry, 'indexPopulatorGeneration'),
    },
    {
        key: 'indexPopulatorVersion',
        label: 'Populator Version',
        width: '8em',
        defaultVisible: true,
        sortValue: (e) => Number(attr(e, 'indexPopulatorVersion')),
        render: (entry) => attr(entry, 'indexPopulatorVersion'),
    },
    {
        key: 'mediaType',
        label: 'mediaType',
        width: '8em',
        defaultVisible: false,
        sortValue: (e) => attr(e, 'mediaType'),
        render: (entry) => attr(entry, 'mediaType'),
    },
    {
        key: 'creationTime',
        label: 'creationTime',
        width: '12em',
        defaultVisible: false,
        sortValue: (e) => Number(attr(e, 'creationTime')),
        render: (entry) => formatTime(attr(entry, 'creationTime')),
    },
    {
        key: 'modificationTime',
        label: 'modificationTime',
        width: '12em',
        defaultVisible: false,
        sortValue: (e) => Number(attr(e, 'modificationTime')),
        render: (entry) => formatTime(attr(entry, 'modificationTime')),
    },
    {
        key: 'extension',
        label: 'extension',
        width: '6em',
        defaultVisible: false,
        sortValue: (e) => attr(e, 'extension'),
        render: (entry) => attr(entry, 'extension'),
    },
    {
        key: 'sharedBy',
        label: 'sharedBy',
        width: '14em',
        defaultVisible: false,
        sortValue: (e) => attr(e, 'sharedBy'),
        render: (entry) => attr(entry, 'sharedBy'),
    },
    {
        key: 'isShared',
        label: 'isShared',
        width: '6em',
        defaultVisible: false,
        sortValue: (e) => attr(e, 'isShared'),
        render: (entry) => attr(entry, 'isShared'),
    },
    {
        key: 'isSharedPublicly',
        label: 'isSharedPublicly',
        width: '6em',
        defaultVisible: false,
        sortValue: (e) => attr(e, 'isSharedPublicly'),
        render: (entry) => attr(entry, 'isSharedPublicly'),
    },
    {
        key: 'keyAuthor',
        label: 'keyAuthor',
        width: '14em',
        defaultVisible: false,
        sortValue: (e) => attr(e, 'keyAuthor'),
        render: (entry) => attr(entry, 'keyAuthor'),
    },
    {
        key: 'activeRevisionContentAuthor',
        label: 'revisionContentAuthor',
        width: '14em',
        defaultVisible: false,
        sortValue: (e) => attr(e, 'activeRevisionContentAuthor'),
        render: (entry) => attr(entry, 'activeRevisionContentAuthor'),
    },
    {
        key: 'activeRevisionCreationTime',
        label: 'revisionCreationTime',
        width: '12em',
        defaultVisible: false,
        sortValue: (e) => Number(attr(e, 'activeRevisionCreationTime')),
        render: (entry) => formatTime(attr(entry, 'activeRevisionCreationTime')),
    },
    {
        key: 'activeRevisionStorageSize',
        label: 'revisionStorageSize',
        width: '8em',
        defaultVisible: false,
        sortValue: (e) => Number(attr(e, 'activeRevisionStorageSize')),
        render: (entry) => attr(entry, 'activeRevisionStorageSize'),
    },
    {
        key: 'trashTime',
        label: 'trashTime',
        width: '12em',
        defaultVisible: false,
        sortValue: (e) => Number(attr(e, 'trashTime')),
        render: (entry) => formatTime(attr(entry, 'trashTime')),
    },
];

const DEFAULT_VISIBLE = new Set(COLUMNS.filter((col) => col.defaultVisible).map((col) => col.key));

// --- Export table ---

function IndexExportTable({ entries, onRemove }: { entries: ExportedEntry[]; onRemove: (identifier: string) => void }) {
    const [visibleColumns, setVisibleColumns] = useState<Set<string>>(DEFAULT_VISIBLE);
    const [sort, setSort] = useState<SortConfig>({ key: 'filename', direction: SORT.ASC });
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [detailEntry, setDetailEntry] = useState<ExportedEntry | null>(null);
    const [detailModalProps, setDetailModalOpen] = useModalState();

    const toggleRowExpanded = (identifier: string) => {
        setExpandedRows((prev) => {
            const next = new Set(prev);
            if (next.has(identifier)) {
                next.delete(identifier);
            } else {
                next.add(identifier);
            }
            return next;
        });
    };

    if (entries.length === 0) {
        return <p>{c('Info').t`Index is empty.`}</p>;
    }

    const toggleColumn = (key: string) => {
        setVisibleColumns((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const toggleSort = (key: string) => {
        setSort((prev) =>
            prev.key === key
                ? { key, direction: prev.direction === SORT.ASC ? SORT.DESC : SORT.ASC }
                : { key, direction: SORT.ASC }
        );
    };

    const openDetails = (entry: ExportedEntry) => {
        setDetailEntry(entry);
        setDetailModalOpen(true);
    };

    const activeColumns = COLUMNS.filter((col) => visibleColumns.has(col.key));

    const nodeUidCol = COLUMNS.find((col) => col.key === 'nodeUid') ?? COLUMNS[0];
    const sortCol = COLUMNS.find((col) => col.key === sort.key) ?? COLUMNS[0];
    const direction = sort.direction === SORT.ASC ? 1 : -1;

    const compare = (a: string | number, b: string | number) => {
        if (a < b) {
            return -1;
        }
        if (a > b) {
            return 1;
        }
        return 0;
    };

    const sortedEntries = [...entries].sort((a, b) => {
        const cmp = compare(sortCol.sortValue(a), sortCol.sortValue(b));
        if (cmp !== 0) {
            return cmp * direction;
        }
        return compare(nodeUidCol.sortValue(a), nodeUidCol.sortValue(b)) * direction;
    });

    return (
        <>
            <div className="flex flex-wrap items-center gap-4 mb-4">
                <span className="text-bold">{c('Label').t`Visible columns:`}</span>
                {COLUMNS.map((col) => (
                    <Checkbox
                        key={col.key}
                        checked={visibleColumns.has(col.key)}
                        onChange={() => toggleColumn(col.key)}
                    >
                        {col.label}
                    </Checkbox>
                ))}
            </div>

            <div className="overflow-auto" style={{ maxHeight: '60vh' }}>
                <Table hasActions>
                    <TableHeader>
                        <tr>
                            {activeColumns.map((col) => (
                                <th
                                    key={col.key}
                                    style={{ cursor: 'pointer', ...(col.width ? { width: col.width } : {}) }}
                                    onClick={() => toggleSort(col.key)}
                                >
                                    <span className="inline-flex flex-nowrap items-center gap-1">
                                        {col.label}
                                        {sort.key === col.key && (
                                            <Icon
                                                name="arrow-up"
                                                size={3}
                                                className={sort.direction === SORT.DESC ? 'rotateX-180' : ''}
                                            />
                                        )}
                                    </span>
                                </th>
                            ))}
                            <th style={{ width: '12em' }}>{c('Title').t`Actions`}</th>
                        </tr>
                    </TableHeader>
                    <TableBody>
                        {sortedEntries.map((entry) => {
                            const isExpanded = expandedRows.has(entry.identifier);
                            return (
                                <TableRow
                                    key={entry.identifier}
                                    className="cursor-pointer"
                                    onClick={() => toggleRowExpanded(entry.identifier)}
                                    cells={[
                                        ...activeColumns.map((col) => (
                                            <span
                                                key={col.key}
                                                className={
                                                    isExpanded
                                                        ? 'text-break'
                                                        : 'text-ellipsis block overflow-hidden whitespace-nowrap'
                                                }
                                                title={String(col.sortValue(entry))}
                                            >
                                                {col.render(entry)}
                                            </span>
                                        )),
                                        <div key="actions" className="flex gap-1">
                                            <Button
                                                size="small"
                                                shape="ghost"
                                                onClick={(e: React.MouseEvent) => {
                                                    e.stopPropagation();
                                                    openDetails(entry);
                                                }}
                                            >{c('Action').t`Details`}</Button>
                                            <Button
                                                size="small"
                                                shape="ghost"
                                                color="danger"
                                                onClick={(e: React.MouseEvent) => {
                                                    e.stopPropagation();
                                                    onRemove(entry.identifier);
                                                }}
                                            >{c('Action').t`Remove`}</Button>
                                        </div>,
                                    ]}
                                />
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {detailEntry && (
                <ModalTwo size="large" {...detailModalProps}>
                    <ModalTwoHeader title={detailEntry.identifier} />
                    <ModalTwoContent>
                        <pre>{JSON.stringify(detailEntry.attributes, null, 2)}</pre>
                    </ModalTwoContent>
                </ModalTwo>
            )}
        </>
    );
}

// --- Main Search component with sub-tabs ---

export function Search() {
    const [tabIndex, setTabIndex] = useState(0);

    return (
        <Tabs
            value={tabIndex}
            onChange={setTabIndex}
            tabs={[
                {
                    title: c('Title').t`Global`,
                    content: <SearchGlobal />,
                },
                ...ALL_INDEX_KINDS.map((kind) => ({
                    title: `Index: ${kind}`,
                    content: <SearchIndex kind={kind} />,
                })),
            ]}
        />
    );
}
