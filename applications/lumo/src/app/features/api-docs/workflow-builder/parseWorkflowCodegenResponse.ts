import type {
    LumoWorkflowCodegenResult,
    LumoWorkflowGraph,
    WorkflowEdge,
    WorkflowNode,
    WorkflowNodeType,
} from './workflowCodegen.types';
import { normalizeWorkflowGraph } from './normalizeWorkflowGraph';

const NODE_TYPES: WorkflowNodeType[] = [
    'file_upload',
    'prompt',
    'conditional',
    'response',
    'loop',
    'merge',
    'other',
];

function isNodeType(v: unknown): v is WorkflowNodeType {
    return typeof v === 'string' && (NODE_TYPES as string[]).includes(v);
}

function isWorkflowNode(v: unknown): v is WorkflowNode {
    if (!v || typeof v !== 'object') {
        return false;
    }
    const o = v as Record<string, unknown>;
    return (
        typeof o.id === 'string' &&
        isNodeType(o.type) &&
        typeof o.title === 'string' &&
        (o.output === undefined || typeof o.output === 'string')
    );
}

function isWorkflowEdge(v: unknown): v is WorkflowEdge {
    if (!v || typeof v !== 'object') {
        return false;
    }
    const o = v as Record<string, unknown>;
    return (
        typeof o.id === 'string' &&
        typeof o.source === 'string' &&
        typeof o.target === 'string' &&
        (o.sourceHandle === undefined || typeof o.sourceHandle === 'string')
    );
}

function isWorkflowGraph(v: unknown): v is LumoWorkflowGraph {
    if (!v || typeof v !== 'object') {
        return false;
    }
    const o = v as Record<string, unknown>;
    if (!Array.isArray(o.nodes) || !Array.isArray(o.edges)) {
        return false;
    }
    return o.nodes.every(isWorkflowNode) && o.edges.every(isWorkflowEdge);
}

function isCodegenResult(v: unknown): v is LumoWorkflowCodegenResult {
    if (!v || typeof v !== 'object') {
        return false;
    }
    const o = v as Record<string, unknown>;
    const code = o.code;
    if (!code || typeof code !== 'object') {
        return false;
    }
    const c = code as Record<string, unknown>;
    return (
        isWorkflowGraph(o.graph) &&
        typeof c.language === 'string' &&
        typeof c.source === 'string' &&
        c.source.length > 0
    );
}

/**
 * Extract bodies of markdown fenced blocks (``` or ```json). Order matches appearance in `raw`.
 * Closing fence may share a line with the JSON (non-greedy match stops at the first closing ```).
 */
function extractFencedBlockBodies(raw: string): string[] {
    const bodies: string[] = [];
    const re = /```(?:json)?\s*\n?([\s\S]*?)```/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(raw)) !== null) {
        bodies.push(m[1].trim());
    }
    return bodies;
}

/**
 * Extract first balanced JSON object from a string (best-effort).
 */
function extractJsonObject(raw: string): string | null {
    const start = raw.indexOf('{');
    if (start === -1) {
        return null;
    }
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = start; i < raw.length; i++) {
        const ch = raw[i];
        if (inString) {
            if (escape) {
                escape = false;
            } else if (ch === '\\') {
                escape = true;
            } else if (ch === '"') {
                inString = false;
            }
            continue;
        }
        if (ch === '"') {
            inString = true;
            continue;
        }
        if (ch === '{') {
            depth++;
        } else if (ch === '}') {
            depth--;
            if (depth === 0) {
                return raw.slice(start, i + 1);
            }
        }
    }
    return null;
}

function tryParseCodegenJson(candidate: string): LumoWorkflowCodegenResult | null {
    try {
        const parsed: unknown = JSON.parse(candidate);
        if (isCodegenResult(parsed)) {
            return {
                ...parsed,
                graph: normalizeWorkflowGraph(parsed.graph),
            };
        }
    } catch {
        // not valid JSON or wrong shape
    }
    return null;
}

/**
 * Parse assistant output into a validated workflow codegen result.
 * Handles prose and disclaimers before/after JSON, multiple fenced blocks (prefers the last valid codegen JSON),
 * and a balanced `{...}` object embedded in text.
 */
export function parseWorkflowCodegenResponse(raw: string): LumoWorkflowCodegenResult | null {
    const trimmed = raw.trim();
    if (!trimmed) {
        return null;
    }

    const fencedBodies = extractFencedBlockBodies(trimmed);
    for (let i = fencedBodies.length - 1; i >= 0; i--) {
        const fromFence = tryParseCodegenJson(fencedBodies[i]);
        if (fromFence) {
            return fromFence;
        }
    }

    const balanced = extractJsonObject(trimmed);
    if (balanced) {
        const fromBalanced = tryParseCodegenJson(balanced);
        if (fromBalanced) {
            return fromBalanced;
        }
    }

    const fromWhole = tryParseCodegenJson(trimmed);
    if (fromWhole) {
        return fromWhole;
    }

    return null;
}
