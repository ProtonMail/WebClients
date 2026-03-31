/**
 * JSON shape Lumo returns for workflow codegen (see workflowCodegenPrompt).
 */

export type WorkflowNodeType =
    | 'file_upload'
    | 'prompt'
    | 'conditional'
    | 'response'
    | 'loop'
    | 'merge'
    | 'other';

export interface WorkflowNode {
    id: string;
    type: WorkflowNodeType;
    title: string;
    /** Variable name produced by this step (optional). */
    output?: string;
}

export interface WorkflowEdge {
    id: string;
    source: string;
    target: string;
    /** For conditional branches: e.g. "true" | "false" or branch label. */
    sourceHandle?: string;
}

export interface LumoWorkflowGraph {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
}

export interface LumoWorkflowCodegenResult {
    graph: LumoWorkflowGraph;
    code: {
        language: string;
        source: string;
    };
}

/** Languages we offer in the UI (subset of API docs code tabs). */
export type WorkflowCodegenLang = 'python' | 'typescript' | 'rust';
