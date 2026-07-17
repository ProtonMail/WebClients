import { type ToolDefinition, type ToolName, UnknownReferenceError } from './types';

describe('framework contracts', () => {
    describe('open ToolName model', () => {
        it('accepts any product-defined identifier as a ToolName', () => {
            // A product owns its own set of names; the framework only ever sees a `string`. These
            // assignments compiling is the contract: nothing here enumerates a product's tools.
            type ProductTool = 'move_emails' | 'archive_document' | 'schedule_meeting';
            const names: ToolName[] = ['move_emails', 'archive_document', 'schedule_meeting'];
            const productName: ProductTool = 'move_emails';
            const asFrameworkName: ToolName = productName;

            expect(names).toContain(asFrameworkName);
        });

        it('lets a definition carry a product-specific name without the framework knowing it', () => {
            const definition: ToolDefinition = {
                name: 'some_product_tool',
                kind: 'read',
                toolDescription: 'does a thing',
                paramsSchema: { type: 'object', additionalProperties: false, required: [], properties: {} },
                serializeForLumo: () => '',
                summarizeChip: () => ({ label: 'ran' }),
            };
            expect(definition.name).toBe('some_product_tool');
        });
    });

    describe('UnknownReferenceError', () => {
        it('carries the offending reference and a self-correcting message', () => {
            const error = new UnknownReferenceError('email-a3f9k2');
            expect(error).toBeInstanceOf(Error);
            expect(error.name).toBe('UnknownReferenceError');
            expect(error.reference).toBe('email-a3f9k2');
            expect(error.message).toContain('email-a3f9k2');
            expect(error.message).toContain('not returned by any earlier tool');
        });
    });
});
