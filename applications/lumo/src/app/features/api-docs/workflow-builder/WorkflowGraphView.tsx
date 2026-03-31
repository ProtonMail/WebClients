import { useEffect, useMemo } from 'react';

import {
    Controls,
    type Edge,
    Handle,
    MiniMap,
    type Node,
    type NodeProps,
    Position,
    ReactFlow,
    useEdgesState,
    useNodesState,
} from '@xyflow/react';
import { clsx } from 'clsx';
import { c } from 'ttag';

import { useLumoTheme } from '../../../providers';
import type { LumoWorkflowGraph, WorkflowEdge, WorkflowNodeType } from './workflowCodegen.types';
import { layoutWorkflowGraph } from './layoutWorkflowGraph';

import '@xyflow/react/dist/style.css';
import './WorkflowGraphView.scss';

interface WorkflowGraphViewProps {
    graph: LumoWorkflowGraph;
    /** Minimum canvas height in px (layout height is used when larger). */
    minCanvasHeightPx?: number;
}

type WorkflowNodeData = {
    title: string;
    typeKey: WorkflowNodeType;
    output?: string;
    isConditional: boolean;
};

const TYPE_LABEL: Record<string, () => string> = {
    file_upload: () => c('collider_2025: Label').t`File upload`,
    prompt: () => c('collider_2025: Label').t`Prompt`,
    conditional: () => c('collider_2025: Label').t`Conditional`,
    response: () => c('collider_2025: Label').t`Response`,
    loop: () => c('collider_2025: Label').t`Loop`,
    merge: () => c('collider_2025: Label').t`Merge`,
    other: () => c('collider_2025: Label').t`Other`,
};

function typeLabel(t: string): string {
    return TYPE_LABEL[t]?.() ?? t;
}

function WorkflowFlowNode({ data }: NodeProps<Node<WorkflowNodeData>>) {
    return (
        <div
            className={clsx(
                'workflow-graph-view-node rounded-xl border bg-norm shadow-sm',
                data.isConditional && 'workflow-graph-view-node-conditional'
            )}
            data-node-type={data.typeKey}
        >
            <Handle className="workflow-graph-view-handle" type="target" position={Position.Top} />
            <div className="workflow-graph-view-node-kind text-2xs uppercase mb-1">{typeLabel(data.typeKey)}</div>
            <div className="text-rg text-bold">{data.title}</div>
            {data.output ? (
                <div className="text-2xs color-weak mt-1 text-monospace">
                    {c('collider_2025: Label').t`Output`}: {data.output}
                </div>
            ) : null}
            {data.isConditional ? (
                <>
                    <Handle
                        id="true"
                        className="workflow-graph-view-handle workflow-graph-view-handle-branch"
                        type="source"
                        position={Position.Bottom}
                        style={{ left: '28%' }}
                    />
                    <Handle
                        id="false"
                        className="workflow-graph-view-handle workflow-graph-view-handle-branch"
                        type="source"
                        position={Position.Bottom}
                        style={{ left: '72%' }}
                    />
                </>
            ) : (
                <Handle className="workflow-graph-view-handle" type="source" position={Position.Bottom} />
            )}
        </div>
    );
}

const nodeTypes = { workflowNode: WorkflowFlowNode };

function toFlowNodes(
    graph: LumoWorkflowGraph,
    layout: ReturnType<typeof layoutWorkflowGraph>
): Node<WorkflowNodeData>[] {
    return layout.nodes.map(({ node, x, y }) => ({
        id: node.id,
        type: 'workflowNode',
        position: { x, y },
        style: { width: layout.nodeWidth },
        data: {
            title: node.title,
            typeKey: node.type,
            output: node.output,
            isConditional: node.type === 'conditional',
        },
    }));
}

/**
 * Map model branch labels to handle ids so React Flow can attach edges (conditional nodes use id "true" | "false").
 */
function normalizeEdgeSourceHandle(edge: WorkflowEdge, graph: LumoWorkflowGraph): string | undefined {
    const sourceNode = graph.nodes.find((n) => n.id === edge.source);
    if (!sourceNode || sourceNode.type !== 'conditional') {
        return undefined;
    }
    const raw = edge.sourceHandle ?? 'true';
    const lower = raw.toLowerCase();
    if (lower === 'false' || lower === 'no' || lower === 'else' || lower === 'n') {
        return 'false';
    }
    if (lower === 'true' || lower === 'yes' || lower === 'if' || lower === 'y') {
        return 'true';
    }
    if (raw === 'true' || raw === 'false') {
        return raw;
    }
    return 'true';
}

function toFlowEdges(graph: LumoWorkflowGraph): Edge[] {
    return graph.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: normalizeEdgeSourceHandle(e, graph),
    }));
}

export const WorkflowGraphView = ({ graph, minCanvasHeightPx = 280 }: WorkflowGraphViewProps) => {
    const { isDarkLumoTheme } = useLumoTheme();
    const layout = useMemo(() => layoutWorkflowGraph(graph), [graph]);

    const { flowNodes, flowEdges } = useMemo(
        () => ({
            flowNodes: toFlowNodes(graph, layout),
            flowEdges: toFlowEdges(graph),
        }),
        [graph, layout]
    );

    const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

    useEffect(() => {
        setNodes(flowNodes);
        setEdges(flowEdges);
    }, [flowNodes, flowEdges, setNodes, setEdges]);

    if (graph.nodes.length === 0) {
        return (
            <div className="workflow-graph-view workflow-graph-view-empty color-weak">
                {c('collider_2025: Info').t`No nodes in this workflow.`}
            </div>
        );
    }

    return (
        <div className="workflow-graph-view rounded-lg bg-norm overflow-hidden">
            <div
                className="workflow-graph-view-flow"
                style={{
                    width: layout.width,
                    height: Math.max(layout.height, minCanvasHeightPx),
                    minWidth: '100%',
                }}
            >
                <ReactFlow
                    className={clsx(isDarkLumoTheme && 'dark')}
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable={false}
                    panOnScroll
                    zoomOnScroll
                    zoomOnPinch
                    minZoom={0.2}
                    maxZoom={1.5}
                    defaultEdgeOptions={{
                        type: 'smoothstep',
                        style: { stroke: 'var(--border-norm)', strokeWidth: 1.5 },
                    }}
                    proOptions={{ hideAttribution: true }}
                    onInit={(instance) => {
                        instance.fitView({ padding: 0.15, maxZoom: 1 });
                    }}
                >
                    <Controls showInteractive={false} />
                    <MiniMap className="workflow-graph-view-minimap" maskColor="var(--background-norm)" pannable zoomable />
                </ReactFlow>
            </div>
        </div>
    );
};
