import { useState } from 'react';

import { c } from 'ttag';

import { Banner } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import { Card } from '@proton/atoms/Card/Card';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { FileInput, InputFieldTwo, Tabs, Toggle } from '@proton/components';
import type { MaybeNode } from '@proton/drive';
import type { ExpectedTreeNode } from '@proton/drive/diagnostic';
import { IcExclamationTriangleFilled } from '@proton/icons/icons/IcExclamationTriangleFilled';

import ModalContentLoader from '../../components/modals/ModalContentLoader';
import { withHoc } from '../../hooks/withHoc';
import type { Results } from './useDiagnosticsState';
import { State, useDiagnosticsState } from './useDiagnosticsState';

type Props = {
    state: State;
    error?: unknown;
    results?: Results;
    currentNode?: MaybeNode;
    runDiagnostics: (options: {
        node?: MaybeNode;
        verifyContent?: boolean;
        verifyThumbnails?: boolean;
        expectedStructure?: ExpectedTreeNode;
    }) => void;
};

export const Diagnostics = withHoc<{}, Props>(useDiagnosticsState, DiagnosticsView);

function DiagnosticsView({ state, error, results, currentNode, runDiagnostics }: Props) {
    if (state === State.LOADING) {
        return <ModalContentLoader>{c('Info').t`Loading`}</ModalContentLoader>;
    }

    if (state === State.ERROR) {
        return (
            <>
                <p>{c('Error').t`Diagnostics failed`}</p>
                <p>{error instanceof Error ? error.message : `${error}`}</p>
            </>
        );
    }

    if (state === State.READY) {
        return <DiagnosticsModalViewOptions runDiagnostics={runDiagnostics} currentNode={currentNode} />;
    }

    if (state === State.RUNNING) {
        return <DiagnosticsModalViewResults finished={false} results={results} />;
    }

    if (state === State.FINISHED) {
        return (
            <>
                <DownloadDiagnosticsButton results={results} />
                <DiagnosticsModalViewResults finished={true} results={results} />
            </>
        );
    }

    throw new Error(`Unknown state: ${state}`);
}

function DiagnosticsModalViewOptions({
    currentNode,
    runDiagnostics,
}: {
    currentNode?: MaybeNode;
    runDiagnostics: (options: {
        node?: MaybeNode;
        verifyContent?: boolean;
        verifyThumbnails?: boolean;
        expectedStructure?: ExpectedTreeNode;
    }) => void;
}) {
    const [onlyCurrentFolder, setOnlyCurrentFolder] = useState(false);
    const [verifyContent, setVerifyContent] = useState(false);
    const [verifyThumbnails, setVerifyThumbnails] = useState(false);
    const [expectedStructure, setExpectedStructure] = useState<ExpectedTreeNode | undefined>(undefined);
    const [expectedStructureError, setExpectedStructureError] = useState<string | undefined>(undefined);

    const handleRun = () => {
        runDiagnostics({
            node: onlyCurrentFolder ? currentNode : undefined,
            verifyContent,
            verifyThumbnails,
            expectedStructure,
        });
    };

    const name = currentNode?.ok ? currentNode.value.name : undefined;

    return (
        <Card>
            <InputFieldTwo
                as={Toggle}
                label={name ? c('Option').t`Only current location: ${name}` : c('Option').t`Only current location`}
                disabled={!name}
                checked={onlyCurrentFolder}
                onChange={() => setOnlyCurrentFolder(!onlyCurrentFolder)}
            />
            <InputFieldTwo
                as={Toggle}
                label={c('Option').t`Verify content`}
                checked={verifyContent}
                onChange={() => setVerifyContent(!verifyContent)}
            />
            <InputFieldTwo
                as={Toggle}
                label={c('Option').t`Verify thumbnails`}
                checked={verifyThumbnails}
                onChange={() => setVerifyThumbnails(!verifyThumbnails)}
            />
            <InputFieldTwo
                as={FileInput}
                label={c('Option').t`Expected structure`}
                onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            try {
                                const expectedStructure = JSON.parse(
                                    event.target?.result as string
                                ) as ExpectedTreeNode;
                                setExpectedStructure(expectedStructure);
                                setExpectedStructureError(undefined);
                            } catch (error) {
                                console.error(error);
                                setExpectedStructureError(c('Error').t`Invalid JSON file`);
                            }
                        };
                        reader.onerror = (event) => {
                            console.error(event);
                            setExpectedStructureError(c('Error').t`Error reading file`);
                        };
                        reader.readAsText(file);
                    }
                }}
                children={c('Option').t`Select JSON file`}
                error={expectedStructureError}
                assistiveText={expectedStructure ? c('Error').t`Expected structure attached` : undefined}
            />
            <Button onClick={handleRun} className="mt-2">{c('Action').t`Run diagnostics`}</Button>
        </Card>
    );
}

function DiagnosticsModalViewResults({ finished, results }: { finished: boolean; results?: Results }) {
    const [tabIndex, setTabIndex] = useState(0);

    return (
        <>
            <DiagnosticsModalViewResultsBanner finished={finished} results={results} />
            <Tabs
                value={tabIndex}
                onChange={setTabIndex}
                tabs={Object.keys(results || {})
                    .sort()
                    .map((type) => ({
                        title: type,
                        content: <DiagnosticsModalViewResultsTable type={type} results={results} />,
                    }))}
            />
        </>
    );
}

function DiagnosticsModalViewResultsBanner({ finished, results }: { finished: boolean; results?: Results }) {
    if (!finished) {
        return (
            <Banner variant="info" className="mb-2">
                <CircleLoader /> {c('Info').t`Running diagnostics...`}
            </Banner>
        );
    }

    if (!results) {
        return <Banner variant="success" className="mb-2">{c('Info').t`No issue found`}</Banner>;
    }

    const isCritical = Object.values(results).some((results) => results.some((result) => result.critical));
    if (isCritical) {
        return <Banner variant="danger" className="mb-2">{c('Info').t`Integrity issues found`}</Banner>;
    }

    return <Banner variant="warning" className="mb-2">{c('Info').t`Issues found`}</Banner>;
}

function DiagnosticsModalViewResultsTable({ type, results }: { type: string; results?: Results }) {
    return (
        <table>
            <thead>
                <tr>
                    <th style={{ width: '100px' }}>{c('Info').t`Time`}</th>
                    {/*eslint-disable-next-line jsx-a11y/control-has-associated-label*/}
                    <th style={{ width: '20px' }}></th>
                    <th>{c('Info').t`Details`}</th>
                </tr>
            </thead>
            <tbody>
                {results?.[type]?.map((result, index) => (
                    <tr key={index}>
                        <td>{result.time.toLocaleTimeString()}</td>
                        <td>{result.critical ? <IcExclamationTriangleFilled /> : null}</td>
                        <td>
                            <pre>{JSON.stringify(result.details, null, 2)}</pre>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function DownloadDiagnosticsButton({ results }: { results?: Results }) {
    return (
        <Button
            className="mb-4"
            onClick={() => {
                const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
            }}
        >{c('Action').t`Download results`}</Button>
    );
}
