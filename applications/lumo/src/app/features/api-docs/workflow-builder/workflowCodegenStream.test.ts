import { appendWorkflowCodegenAssistantText } from './workflowCodegenStream';

describe('appendWorkflowCodegenAssistantText', () => {
    it('concatenates message token chunks', () => {
        let acc = '';
        acc = appendWorkflowCodegenAssistantText(acc, {
            type: 'token_data',
            target: 'message',
            count: 0,
            content: '{"a":',
        });
        acc = appendWorkflowCodegenAssistantText(acc, {
            type: 'token_data',
            target: 'message',
            count: 1,
            content: '1}',
        });
        expect(acc).toBe('{"a":1}');
    });

    it('ignores non-message token targets', () => {
        let acc = 'x';
        acc = appendWorkflowCodegenAssistantText(acc, {
            type: 'token_data',
            target: 'title',
            count: 0,
            content: 'title',
        });
        expect(acc).toBe('x');
    });

    it('throws on terminal error types', () => {
        expect(() =>
            appendWorkflowCodegenAssistantText('', { type: 'error' })
        ).toThrow('workflow_codegen_generation_error');
        expect(() =>
            appendWorkflowCodegenAssistantText('', { type: 'rejected' })
        ).toThrow('workflow_codegen_generation_rejected');
    });
});
