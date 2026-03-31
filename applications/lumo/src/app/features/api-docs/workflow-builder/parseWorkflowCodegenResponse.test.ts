import { parseWorkflowCodegenResponse } from './parseWorkflowCodegenResponse';

describe('parseWorkflowCodegenResponse', () => {
    const minimal = {
        graph: {
            nodes: [{ id: 'a', type: 'prompt' as const, title: 'Start' }],
            edges: [],
        },
        code: { language: 'python', source: 'print(1)' },
    };

    it('parses raw JSON', () => {
        expect(parseWorkflowCodegenResponse(JSON.stringify(minimal))).toEqual(minimal);
    });

    it('parses fenced json block', () => {
        const wrapped = `Here you go:\n\`\`\`json\n${JSON.stringify(minimal, null, 2)}\n\`\`\``;
        expect(parseWorkflowCodegenResponse(wrapped)).toEqual(minimal);
    });

    it('extracts first JSON object from surrounding text', () => {
        const wrapped = `Note:\n${JSON.stringify(minimal)} trailing`;
        expect(parseWorkflowCodegenResponse(wrapped)).toEqual(minimal);
    });

    it('prefers the last fenced block that parses as workflow JSON when multiple fences exist', () => {
        const noise = '```text\nignore\n```';
        const payload = `\`\`\`json\n${JSON.stringify(minimal)}\n\`\`\``;
        const wrapped = `Intro\n${noise}\n\n${payload}`;
        expect(parseWorkflowCodegenResponse(wrapped)).toEqual(minimal);
    });

    it('returns null for invalid payload', () => {
        expect(parseWorkflowCodegenResponse('not json')).toBeNull();
        expect(parseWorkflowCodegenResponse('{"graph":{}}')).toBeNull();
    });

    it('normalizes a graph with no edges into a chain when there are multiple nodes', () => {
        const twoNodes = {
            graph: {
                nodes: [
                    { id: 'x', type: 'prompt' as const, title: 'First' },
                    { id: 'y', type: 'response' as const, title: 'Second' },
                ],
                edges: [] as { id: string; source: string; target: string }[],
            },
            code: { language: 'python', source: 'print(1)' },
        };
        const parsed = parseWorkflowCodegenResponse(JSON.stringify(twoNodes));
        expect(parsed).not.toBeNull();
        expect(parsed!.graph.edges).toHaveLength(1);
        expect(parsed!.graph.edges[0].source).toBe('x');
        expect(parsed!.graph.edges[0].target).toBe('y');
    });
});
