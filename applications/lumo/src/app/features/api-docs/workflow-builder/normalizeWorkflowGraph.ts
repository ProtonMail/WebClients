import type { LumoWorkflowGraph, WorkflowEdge } from './workflowCodegen.types';

function edgeKey(e: WorkflowEdge): string {
    return `${e.source}|${e.target}|${e.sourceHandle ?? ''}`;
}

/**
 * Keeps only edges whose endpoints exist, deduplicates, and if there are no edges but
 * multiple nodes, adds a simple chain following the order of `nodes` in the payload.
 */
export function normalizeWorkflowGraph(graph: LumoWorkflowGraph): LumoWorkflowGraph {
    const nodeIds = new Set(graph.nodes.map((n) => n.id));

    const filtered = graph.edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));

    const seen = new Set<string>();
    const deduped: WorkflowEdge[] = [];
    for (const e of filtered) {
        const k = edgeKey(e);
        if (seen.has(k)) {
            continue;
        }
        seen.add(k);
        deduped.push(e);
    }

    if (graph.nodes.length >= 2 && deduped.length === 0) {
        const chain: WorkflowEdge[] = [];
        for (let i = 0; i < graph.nodes.length - 1; i++) {
            const a = graph.nodes[i].id;
            const b = graph.nodes[i + 1].id;
            chain.push({ id: `workflow-auto-${i}-${a}-${b}`, source: a, target: b });
        }
        return { nodes: graph.nodes, edges: chain };
    }

    return { nodes: graph.nodes, edges: deduped };
}
