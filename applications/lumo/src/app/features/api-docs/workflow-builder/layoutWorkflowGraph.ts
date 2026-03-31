import type { LumoWorkflowGraph, WorkflowNode } from './workflowCodegen.types';

const NODE_W = 200;
const NODE_H = 96;
const COL_GAP = 32;
const ROW_GAP = 48;
const PADDING = 24;

export interface LayoutedNode {
    node: WorkflowNode;
    x: number;
    y: number;
}

export interface WorkflowGraphLayout {
    nodes: LayoutedNode[];
    width: number;
    height: number;
    nodeWidth: number;
    nodeHeight: number;
}

/**
 * Longest-path layering: roots at depth 0; each node's depth is max(predecessor depth)+1.
 */
function computeDepths(nodes: WorkflowNode[], edges: { source: string; target: string }[]): Map<string, number> {
    const preds = new Map<string, string[]>();
    nodes.forEach((n) => preds.set(n.id, []));
    edges.forEach((e) => {
        if (preds.has(e.target)) {
            preds.get(e.target)!.push(e.source);
        }
    });

    const memo = new Map<string, number>();

    function depth(id: string): number {
        if (memo.has(id)) {
            return memo.get(id)!;
        }
        const ps = preds.get(id) ?? [];
        if (ps.length === 0) {
            memo.set(id, 0);
            return 0;
        }
        const d = Math.max(...ps.map(depth)) + 1;
        memo.set(id, d);
        return d;
    }

    nodes.forEach((n) => depth(n.id));
    return memo;
}

export function layoutWorkflowGraph(graph: LumoWorkflowGraph): WorkflowGraphLayout {
    const { nodes, edges } = graph;
    if (nodes.length === 0) {
        return { nodes: [], width: PADDING * 2, height: PADDING * 2, nodeWidth: NODE_W, nodeHeight: NODE_H };
    }

    const depths = computeDepths(nodes, edges);
    const maxDepth = Math.max(...nodes.map((n) => depths.get(n.id) ?? 0), 0);

    const layers = new Map<number, WorkflowNode[]>();
    nodes.forEach((n) => {
        const d = depths.get(n.id) ?? 0;
        if (!layers.has(d)) {
            layers.set(d, []);
        }
        layers.get(d)!.push(n);
    });

    for (let d = 0; d <= maxDepth; d++) {
        const layer = layers.get(d);
        if (layer) {
            layer.sort((a, b) => a.id.localeCompare(b.id));
        }
    }

    let maxLayerWidth = 0;
    const rowWidths: number[] = [];
    for (let d = 0; d <= maxDepth; d++) {
        const layer = layers.get(d) ?? [];
        const w = layer.length * NODE_W + Math.max(0, layer.length - 1) * COL_GAP;
        rowWidths[d] = w;
        maxLayerWidth = Math.max(maxLayerWidth, w);
    }

    const layouted: LayoutedNode[] = [];
    for (let d = 0; d <= maxDepth; d++) {
        const layer = layers.get(d) ?? [];
        const layerW = layer.length * NODE_W + Math.max(0, layer.length - 1) * COL_GAP;
        let x = PADDING + (maxLayerWidth - layerW) / 2;
        const y = PADDING + d * (NODE_H + ROW_GAP);
        layer.forEach((n) => {
            layouted.push({ node: n, x, y });
            x += NODE_W + COL_GAP;
        });
    }

    const height = PADDING * 2 + (maxDepth + 1) * NODE_H + maxDepth * ROW_GAP;
    const width = PADDING * 2 + maxLayerWidth;

    return { nodes: layouted, width, height, nodeWidth: NODE_W, nodeHeight: NODE_H };
}
