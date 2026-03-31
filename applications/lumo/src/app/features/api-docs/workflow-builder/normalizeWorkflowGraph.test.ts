import { normalizeWorkflowGraph } from './normalizeWorkflowGraph';

describe('normalizeWorkflowGraph', () => {
    it('adds a chain in node order when there are no edges but multiple nodes', () => {
        const graph = {
            nodes: [
                { id: 'n1', type: 'file_upload' as const, title: 'Upload' },
                { id: 'n2', type: 'prompt' as const, title: 'Ask' },
                { id: 'n3', type: 'response' as const, title: 'Reply' },
            ],
            edges: [] as { id: string; source: string; target: string }[],
        };
        const out = normalizeWorkflowGraph(graph);
        expect(out.edges).toHaveLength(2);
        expect(out.edges[0]).toMatchObject({ source: 'n1', target: 'n2' });
        expect(out.edges[1]).toMatchObject({ source: 'n2', target: 'n3' });
    });

    it('drops edges that reference unknown node ids', () => {
        const graph = {
            nodes: [{ id: 'a', type: 'prompt' as const, title: 'A' }],
            edges: [{ id: 'e1', source: 'a', target: 'missing' }],
        };
        const out = normalizeWorkflowGraph(graph);
        expect(out.edges).toHaveLength(0);
    });
});
