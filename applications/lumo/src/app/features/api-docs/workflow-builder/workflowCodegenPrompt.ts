import { c } from 'ttag';

import type { WorkflowCodegenLang } from './workflowCodegen.types';

const SCHEMA_DESCRIPTION = `You must respond with a single JSON object only (no markdown outside it). Schema:
{
  "graph": {
    "nodes": [
      { "id": string, "type": "file_upload" | "prompt" | "conditional" | "response" | "loop" | "merge" | "other", "title": string, "output"?: string }
    ],
    "edges": [
      { "id": string, "source": string, "target": string, "sourceHandle"?: string }
    ]
  },
  "code": {
    "language": string,
    "source": string
  }
}

Rules:
- "graph" must be a directed acyclic workflow: every "edges[].source" and "edges[].target" MUST be an "id" from "nodes". Do not omit edges: the graph must be connected from inputs to outputs.
- If there are N nodes (N >= 2), include at least N-1 edges so every step (except the last) has an outgoing edge to the next step. Prefer a single clear path through the workflow; add parallel edges only for real branches (e.g. conditional).
- List "nodes" in execution order when possible so the flow reads top-to-bottom.
- Use meaningful node titles. Set "output" where the step exposes a variable name for later steps.
- For conditional branches, use exactly two edges from the conditional node with sourceHandle "true" and "false" respectively (those literal strings).
- "code.source" must be complete runnable code in the requested language that implements the workflow using the Lumo HTTP API. Use base URL https://lumo.proton.me/api/ai/v1 (or document a single configurable base URL). Authentication MUST use the header "Authorization" with the API key from an environment variable (e.g. LUMO_API_KEY) used as the Bearer token. Request JSON MUST use "model": "auto" unless a specific documented model id is required. Do not include prose in code.
- Streaming is mandatory for every Lumo chat completion call in "code.source": the request body MUST set "stream": true. Do not use a non-streaming request and a single response.json() / one-shot body parse as the primary path.
- SSE parsing (OpenAI-compatible): lines start with "data: "; JSON payload per line; end marker "data: [DONE]". Each payload may include choices[0].delta. CRITICAL: choices[i].delta may be JSON null or absent (role-only or finish chunks). Never use .get("delta", {}) alone: in Python a present key with value null makes .get return null, not the default — you must use (choice.get("delta") or {}) and verify the value is a mapping/object before .get("content"). The content field may be null or missing; only concatenate actual strings. Skip non-string content. Ignore JSON parse errors for malformed lines.
- Use idiomatic streaming I/O for the language (e.g. Python: requests.post(..., stream=True) or httpx stream and iterate lines; TypeScript: fetch response.body ReadableStream + TextDecoder line parsing; Rust: reqwest bytes/async lines). Do not pretend the API returns one JSON object for the full completion when stream is true.`;

export function getWorkflowCodegenSystemPrompt(): string {
    return `${SCHEMA_DESCRIPTION}

You are a Lumo workflow and code generator.`;
}

export function buildWorkflowCodegenUserPrompt(userGoal: string, lang: WorkflowCodegenLang): string {
    const langLabel =
        lang === 'python'
            ? c('collider_2025: Label').t`Python`
            : lang === 'typescript'
              ? c('collider_2025: Label').t`TypeScript`
              : c('collider_2025: Label').t`Rust`;

    const header = c('collider_2025: Info')
        .t`Generate a workflow graph and implementation code for the following goal. Target language for code:`;

    const streamingNote = c('collider_2025: Info')
        .t`In the generated code, use Authorization: Bearer, model "auto", stream: true, and null-safe parsing of choices[].delta (delta may be null; only append string content).`;

    return `${header} ${langLabel}\n\n${userGoal.trim()}\n\n${streamingNote}`;
}
