import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Option, SelectTwo, TextAreaTwo, useApi, useNotifications } from '@proton/components/index';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { SignInButton } from '../../../components/Guest/SignInLink';
import { LumoMarkdownCodeBlock } from '../../../components/LumoMarkdown/LumoMarkdownCodeBlock';
import { LumoApiClient, createSystemTurn, createUserTurn } from '../../../lib/lumo-api-client';
import { WorkflowGraphView } from './WorkflowGraphView';
import { parseWorkflowCodegenResponse } from './parseWorkflowCodegenResponse';
import type { LumoWorkflowCodegenResult, WorkflowCodegenLang } from './workflowCodegen.types';
import { mapCodeLanguageToPreClass } from './workflowCodegenDisplay';
import { buildWorkflowCodegenUserPrompt, getWorkflowCodegenSystemPrompt } from './workflowCodegenPrompt';
import { appendWorkflowCodegenAssistantText } from './workflowCodegenStream';

const WORKFLOW_LANG_OPTIONS = [
    { value: 'python' as const, text: c('collider_2025: Label').t`Python` },
    { value: 'typescript' as const, text: c('collider_2025: Label').t`TypeScript` },
    { value: 'rust' as const, text: c('collider_2025: Label').t`Rust` },
];

/** Short labels + full prompts for the textarea (module-level for ttag). */
const WORKFLOW_EXAMPLE_PROMPTS: { label: string; prompt: string }[] = [
    {
        label: c('collider_2025: Label').t`Summarize documents`,
        prompt: c('collider_2025: Info')
            .t`A workflow that uploads a folder of PDFs, extracts text, asks ${LUMO_SHORT_APP_NAME} to summarize each file, and writes one Markdown summary per document.`,
    },
    {
        label: c('collider_2025: Label').t`Entity extraction`,
        prompt: c('collider_2025: Info')
            .t`Read a batch of text files, extract people, organizations, and dates with ${LUMO_SHORT_APP_NAME}, then emit a CSV of entities per file.`,
    },
    {
        label: c('collider_2025: Label').t`Support ticket triage`,
        prompt: c('collider_2025: Info')
            .t`Ingest a customer message, classify urgency and topic with ${LUMO_SHORT_APP_NAME}, branch on whether it needs escalation, then draft a reply or hand off to a human.`,
    },
    {
        label: c('collider_2025: Label').t`Research brief`,
        prompt: c('collider_2025: Info')
            .t`Given a topic, use ${LUMO_SHORT_APP_NAME} to outline sub-questions, answer each in turn, and merge the answers into a single structured brief.`,
    },
    {
        label: c('collider_2025: Label').t`Compare two drafts`,
        prompt: c('collider_2025: Info')
            .t`Load two versions of a policy, ask ${LUMO_SHORT_APP_NAME} to list differences and risks, then produce a short recommendation for which version to adopt.`,
    },
];

interface WorkflowCodegenPanelProps {
    isGuest: boolean;
}

export const WorkflowCodegenPanel = ({ isGuest }: WorkflowCodegenPanelProps) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const clientRef = useRef(new LumoApiClient());
    const abortRef = useRef<AbortController | null>(null);

    const [prompt, setPrompt] = useState('');
    const [lang, setLang] = useState<WorkflowCodegenLang>('python');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<LumoWorkflowCodegenResult | null>(null);
    const [rawUnparsed, setRawUnparsed] = useState<string | null>(null);
    const [outputTab, setOutputTab] = useState<'graph' | 'code'>('graph');

    useEffect(() => {
        return () => abortRef.current?.abort();
    }, []);

    useEffect(() => {
        if (result) {
            setOutputTab('graph');
        }
    }, [result]);

    const handleGenerate = useCallback(async () => {
        if (!prompt.trim()) {
            createNotification({
                type: 'error',
                text: c('collider_2025: Error').t`Describe what you want the workflow to do.`,
            });
            return;
        }

        abortRef.current?.abort();
        abortRef.current = new AbortController();
        setLoading(true);
        setResult(null);
        setRawUnparsed(null);

        const turns = [
            createSystemTurn(getWorkflowCodegenSystemPrompt()),
            createUserTurn(buildWorkflowCodegenUserPrompt(prompt, lang)),
        ];

        let accumulated = '';

        try {
            await clientRef.current.callAssistant(api, turns, {
                signal: abortRef.current.signal,
                enableExternalTools: false,
                enableImageTools: false,
                chunkCallback: async (message) => {
                    accumulated = appendWorkflowCodegenAssistantText(accumulated, message);
                },
                finishCallback: async (status) => {
                    setLoading(false);
                    if (status === 'failed') {
                        createNotification({
                            type: 'error',
                            text: c('collider_2025: Error').t`Could not generate a workflow. Try again.`,
                        });
                        return;
                    }
                    const text = accumulated.trim();
                    if (!text) {
                        createNotification({
                            type: 'error',
                            text: c('collider_2025: Error').t`Could not generate a workflow. Try again.`,
                        });
                        return;
                    }
                    const parsed = parseWorkflowCodegenResponse(accumulated);
                    if (!parsed) {
                        setRawUnparsed(accumulated);
                        createNotification({
                            type: 'warning',
                            text: c('collider_2025: Error')
                                .t`The response could not be parsed. Raw output is shown below.`,
                        });
                    } else {
                        setResult(parsed);
                    }
                },
            });
        } catch (e) {
            setLoading(false);
            if ((e as Error)?.name === 'AbortError') {
                return;
            }
            createNotification({
                type: 'error',
                text: c('collider_2025: Error').t`Could not generate a workflow. Try again.`,
            });
        }
    }, [api, createNotification, lang, prompt]);

    if (isGuest) {
        return (
            <div className="workflow-codegen-panel w-full min-w-0">
                <h1 className="text-bold text-2xl mt-0 mb-2">{c('collider_2025: Title').t`Workflow Builder`}</h1>
                <p className="color-weak mt-0 mb-4" style={{ lineHeight: 1.6 }}>
                    {c('collider_2025: Info')
                        .t`Describe a workflow in plain language and get a graph plus runnable code. Sign in to use this feature.`}
                </p>
                <div className="rounded-lg border border-weak p-6 bg-weak">
                    <p className="m-0 color-weak mb-4">
                        {c('collider_2025: Info').t`Sign in to generate workflows with ${LUMO_SHORT_APP_NAME}.`}
                    </p>
                    <SignInButton color="norm" shape="solid" />
                </div>
            </div>
        );
    }

    return (
        <div className="workflow-codegen-panel w-full min-w-0">
            <h1 className="text-bold text-2xl mt-0 mb-2">{c('collider_2025: Title').t`Workflow Builder`}</h1>
            <p className="color-weak mt-0 mb-4" style={{ lineHeight: 1.6 }}>
                {c('collider_2025: Info')
                    .t`We can help you get started with using the ${LUMO_SHORT_APP_NAME} API. Describe what you want to automate. ${LUMO_SHORT_APP_NAME} returns a workflow graph and sample code that calls the ${LUMO_SHORT_APP_NAME} API.`}
            </p>

            <div className="rounded-lg border border-weak bg-norm p-4 mb-6">
                <label htmlFor="workflow-codegen-prompt" className="text-semibold mb-2 block">
                    {c('collider_2025: Label').t`Your workflow`}
                </label>
                <p className="text-rg color-weak mt-0 mb-2">{c('collider_2025: Label').t`Example ideas`}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                    {WORKFLOW_EXAMPLE_PROMPTS.map((ex) => (
                        <Button
                            key={ex.label}
                            onClick={() => setPrompt(ex.prompt)}
                            disabled={loading}
                            size="small"
                            shape="outline"
                            type="button"
                        >
                            {ex.label}
                        </Button>
                    ))}
                </div>
                <TextAreaTwo
                    id="workflow-codegen-prompt"
                    className="border border-weak rounded-lg mb-4"
                    placeholder={c('collider_2025:Placeholder')
                        .t`e.g. Iterate over documents in a folder, extract people and dates from each, then build a graph of how terms relate.`}
                    value={prompt}
                    onValue={setPrompt}
                    rows={4}
                    disabled={loading}
                />
                <div className="flex flex-row flex-wrap items-center justify-between gap-x-4 gap-y-3">
                    <div className="flex flex-row flex-wrap items-center gap-x-3 gap-y-2 min-w-0">
                        <label htmlFor="workflow-codegen-lang" className="m-0 shrink-0 text-rg color-weak">
                            {c('collider_2025: Label').t`Code language`}
                        </label>
                        <SelectTwo
                            id="workflow-codegen-lang"
                            className="min-w-custom shrink-0"
                            style={{ '--min-w-custom': '11rem' } as CSSProperties}
                            fullWidth={false}
                            value={lang}
                            onValue={(value) => setLang(value as WorkflowCodegenLang)}
                            disabled={loading}
                        >
                            {WORKFLOW_LANG_OPTIONS.map((option) => (
                                <Option key={option.value} value={option.value} title={option.text} />
                            ))}
                        </SelectTwo>
                    </div>
                    <Button
                        color="norm"
                        shape="solid"
                        loading={loading}
                        onClick={() => handleGenerate()}
                        type="button"
                        className="shrink-0"
                    >
                        {c('collider_2025: Action').t`Generate workflow`}
                    </Button>
                </div>
            </div>

            {loading ? <p className="color-weak mt-0 mb-6">{c('collider_2025: Info').t`Generating…`}</p> : undefined}

            {result ? (
                <section className="mb-8" aria-label={c('collider_2025: Title').t`Workflow output`}>
                    <div className="flex flex-wrap gap-2 mb-4">
                        <Button
                            shape={outputTab === 'graph' ? 'solid' : 'ghost'}
                            size="small"
                            type="button"
                            onClick={() => setOutputTab('graph')}
                        >
                            {c('collider_2025: Title').t`Workflow graph`}
                        </Button>
                        <Button
                            shape={outputTab === 'code' ? 'solid' : 'ghost'}
                            size="small"
                            type="button"
                            onClick={() => setOutputTab('code')}
                        >
                            {c('collider_2025: Title').t`Generated code`}
                        </Button>
                    </div>
                    {outputTab === 'graph' ? (
                        <div className="min-w-0">
                            <WorkflowGraphView graph={result.graph} minCanvasHeightPx={420} />
                        </div>
                    ) : (
                        <div className="min-w-0 overflow-auto" style={{ maxHeight: 'min(72vh, 52rem)' }}>
                            <div className="w-full min-w-0">
                                <LumoMarkdownCodeBlock
                                    code={result.code.source}
                                    language={mapCodeLanguageToPreClass(result.code.language)}
                                />
                            </div>
                        </div>
                    )}
                </section>
            ) : null}

            {rawUnparsed ? (
                <div className="mt-4">
                    <h2 className="text-bold text-lg mt-0 mb-2">{c('collider_2025: Title').t`Raw response`}</h2>
                    <div className="overflow-auto" style={{ maxHeight: 'min(480px, 70vh)' }}>
                        <div className="w-full min-w-0">
                            <LumoMarkdownCodeBlock code={rawUnparsed} language="plaintext" />
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};
