import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom-v5-compat';

import type { MaybeNode } from '@proton/drive';
import { useDrive } from '@proton/drive';
import {
    type Diagnostic,
    type DiagnosticResult,
    type ExpectedTreeNode,
    useDriveDiagnostics,
} from '@proton/drive/diagnostic';

import config from '../../config';
import { handleSdkError } from '../../utils/errorHandling/handleSdkError';

export enum State {
    LOADING = 'loading',
    READY = 'ready',
    RUNNING = 'running',
    FINISHED = 'finished',
    ERROR = 'error',
}

export type Results = {
    [type: string]: Result[];
};

type Result = {
    time: Date;
    critical: boolean;
    details: Omit<DiagnosticResult, 'type'>;
};

const CRITICAL_TYPES = [
    'fatal_error',
    'sdk_error',
    'degraded_node',
    'unverified_author',
    'extended_attributes_error',
    'extended_attributes_missing_field',
    'content_file_missing_revision',
    'content_integrity_error',
];

export const useDiagnosticsState = () => {
    const [state, setState] = useState<State>(State.LOADING);
    const [currentNode, setCurrentNode] = useState<MaybeNode | undefined>(undefined);
    const [diagnostics, setDiagnostics] = useState<Diagnostic>();
    const [error, setError] = useState<unknown>();
    const [results, setResults] = useState<Results | undefined>(undefined);

    const { drive } = useDrive();
    const { init } = useDriveDiagnostics();
    const params = useParams()['*'];

    const loadCurrentNode = (params?: string) => {
        if (!params) {
            return;
        }

        let shareId: string;
        let linkId: string;

        try {
            const split = params.split('?')[0].split('/');
            shareId = split[0];
            linkId = split[2];
        } catch (error: unknown) {
            console.warn(error);
            return;
        }

        if (!shareId || !linkId) {
            return;
        }

        void drive
            .getNodeUid(shareId, linkId)
            .then((nodeUid) => drive.getNode(nodeUid))
            .then((node) => setCurrentNode(node));
    };

    const initDiagnostics = () => {
        init({ appName: config.APP_NAME, appVersion: config.APP_VERSION })
            .then((diagnostics) => {
                setDiagnostics(diagnostics);
                setState(State.READY);
            })
            .catch((error: unknown) => {
                setError(error);
                setState(State.ERROR);
                handleSdkError(error);
            });
    };

    useEffect(() => {
        loadCurrentNode(params);
    }, [params]);

    useEffect(() => {
        initDiagnostics();
    }, []);

    const runDiagnostics = (options: {
        node?: MaybeNode;
        verifyContent?: boolean;
        verifyThumbnails?: boolean;
        expectedStructure?: ExpectedTreeNode;
    }): void => {
        if (!diagnostics) {
            return;
        }

        setState(State.RUNNING);

        const run = async () => {
            try {
                const iterator = options.node
                    ? diagnostics.verifyNodeTree(options.node, options)
                    : diagnostics.verifyMyFiles(options);

                for await (const sdkResult of iterator) {
                    const time = new Date();
                    const { type, ...details } = sdkResult;
                    const result: Result = {
                        time,
                        critical: CRITICAL_TYPES.includes(type),
                        details,
                    };

                    setResults((prev) => {
                        if (!prev) {
                            return {
                                [type]: [result],
                            };
                        }

                        return {
                            ...prev,
                            [type]: [...(prev[type] || []), result],
                        };
                    });
                }

                setState(State.FINISHED);
            } catch (error) {
                setError(error);
                setState(State.ERROR);
                handleSdkError(error);
            }
        };

        void run();
    };

    return {
        state,
        error,
        results,
        currentNode,
        runDiagnostics,
    };
};
