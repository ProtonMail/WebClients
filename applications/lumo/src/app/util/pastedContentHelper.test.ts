import { describe, expect, it } from '@jest/globals';
import {
    createAttachmentFromPastedContent,
    generateFilenameForPastedContent,
    getPasteConversionMessage,
    PASTE_TO_ATTACHMENT_CONFIG,
    shouldConvertPasteToAttachment,
} from './pastedContentHelper';
import { parseFileReferences } from './fileReferences';

describe('pastedContentHelper', () => {
    describe('shouldConvertPasteToAttachment', () => {
        it('should return false for small content', () => {
            const smallContent = 'This is a small piece of text';
            expect(shouldConvertPasteToAttachment(smallContent)).toBe(false);
        });

        it('should return true for content with many lines', () => {
            const manyLines = Array(PASTE_TO_ATTACHMENT_CONFIG.MIN_LINES + 1)
                .fill('line')
                .join('\n');
            expect(shouldConvertPasteToAttachment(manyLines)).toBe(true);
        });

        it('should return true for content with many characters', () => {
            const manyChars = 'a'.repeat(PASTE_TO_ATTACHMENT_CONFIG.MIN_CHARS + 1);
            expect(shouldConvertPasteToAttachment(manyChars)).toBe(true);
        });

        it('should return false for empty content', () => {
            expect(shouldConvertPasteToAttachment('')).toBe(false);
        });

        it('should return false for null/undefined', () => {
            expect(shouldConvertPasteToAttachment(null as any)).toBe(false);
            expect(shouldConvertPasteToAttachment(undefined as any)).toBe(false);
        });
    });

    describe('generateFilenameForPastedContent', () => {

        it('should detect JSON content', () => {
            const jsonContent = '{"key": "value", "array": [1, 2, 3]}';
            const filename = generateFilenameForPastedContent(jsonContent);
            expect(filename).toMatch(/^pasted-data-.*\.json$/);
        });

        it('should detect CSV content', () => {
            const csvContent = 'name,age,city\nJohn,30,NYC\nJane,25,LA\nBob,35,SF\nAlice,28,Chicago\nCharlie,32,Boston';
            const filename = generateFilenameForPastedContent(csvContent);
            expect(filename).toMatch(/^pasted-data-.*\.csv$/);
        });

        it('should detect markdown content', () => {
            const markdownContent = '# Title\n\n## Subtitle\n\nSome content here';
            const filename = generateFilenameForPastedContent(markdownContent);
            expect(filename).toMatch(/^pasted-content-.*\.md$/);
        });

        it('should default to .txt for plain text', () => {
            const plainContent = 'Just some plain text without special formatting';
            const filename = generateFilenameForPastedContent(plainContent);
            expect(filename).toMatch(/^pasted-content-.*\.txt$/);
        });

        it('should include timestamp in filename', () => {
            const content = 'test content';
            const filename = generateFilenameForPastedContent(content);
            // Should match pattern like: pasted-content-2026-01-19T15-30-45.txt
            expect(filename).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/);
        });
    });

    describe('createAttachmentFromPastedContent', () => {
        it('should create a valid attachment object', () => {
            const content = 'Test content for attachment';
            const attachment = createAttachmentFromPastedContent(content);

            expect(attachment).toHaveProperty('id');
            expect(attachment).toHaveProperty('filename');
            expect(attachment).toHaveProperty('mimeType');
            expect(attachment).toHaveProperty('markdown', content);
            expect(attachment).toHaveProperty('data');
            expect(attachment).toHaveProperty('uploadedAt');
            expect(attachment).toHaveProperty('rawBytes');
            expect(attachment).toHaveProperty('tokenCount');
            expect(attachment.processing).toBe(false);
        });

        it('should set correct MIME type for JSON', () => {
            const jsonContent = '{"test": true}';
            const attachment = createAttachmentFromPastedContent(jsonContent);
            expect(attachment.mimeType).toBe('application/json');
        });

        it('should set correct MIME type for CSV', () => {
            const csvContent = 'a,b,c\n1,2,3\n4,5,6\n7,8,9\n10,11,12\n13,14,15';
            const attachment = createAttachmentFromPastedContent(csvContent);
            expect(attachment.mimeType).toBe('text/csv');
        });

        it('should set correct MIME type for markdown', () => {
            const mdContent = '# Heading\n\nContent';
            const attachment = createAttachmentFromPastedContent(mdContent);
            expect(attachment.mimeType).toBe('text/markdown');
        });

        it('should default to text/plain MIME type', () => {
            const plainContent = 'Plain text content';
            const attachment = createAttachmentFromPastedContent(plainContent);
            expect(attachment.mimeType).toBe('text/plain');
        });

        it('should encode content as UTF-8', () => {
            const content = 'Test with émojis 🎉 and spëcial çharacters';
            const attachment = createAttachmentFromPastedContent(content);
            
            // Decode the data to verify it matches
            const decoder = new TextDecoder();
            const decoded = decoder.decode(attachment.data);
            expect(decoded).toBe(content);
        });

        it('should calculate rawBytes correctly', () => {
            const content = 'Test content';
            const attachment = createAttachmentFromPastedContent(content);
            const encoder = new TextEncoder();
            const expectedBytes = encoder.encode(content).length;
            expect(attachment.rawBytes).toBe(expectedBytes);
        });
    });

    describe('getPasteConversionMessage', () => {
        it('should return line-based message when line threshold is met', () => {
            const message = getPasteConversionMessage(100, 1000);
            expect(message).toContain('100 lines');
            expect(message).toContain('converted to attachment');
        });

        it('should return character-based message when only char threshold is met', () => {
            const message = getPasteConversionMessage(10, 5000);
            expect(message).toContain('5K characters');
            expect(message).toContain('converted to attachment');
        });

        it('should prioritize line count in message', () => {
            const message = getPasteConversionMessage(75, 10000);
            expect(message).toContain('75 lines');
            expect(message).not.toContain('characters');
        });
    });

    describe('parseFileReferences', () => {
        it('should parse @filename.pdf with spaces', () => {
            const content = 'hey lumo, what is in @Q1 2026 - Lumo - Planning - OKR - Confluence.pdf?';
            const refs = parseFileReferences(content);
            expect(refs).toHaveLength(1);
            expect(refs[0].fileName).toBe('Q1 2026 - Lumo - Planning - OKR - Confluence.pdf');
        });

        it('should parse @filename.pdf without spaces', () => {
            const content = 'check out @document.pdf';
            const refs = parseFileReferences(content);
            expect(refs).toHaveLength(1);
            expect(refs[0].fileName).toBe('document.pdf');
        });

        it('should parse multiple file references', () => {
            const content = 'compare @file1.pdf and @file 2.docx';
            const refs = parseFileReferences(content);
            expect(refs).toHaveLength(2);
        });

        it('should handle @file references at end of sentence', () => {
            const content = 'what is in @my document.pdf.';
            const refs = parseFileReferences(content);
            expect(refs).toHaveLength(1);
            expect(refs[0].fileName).toBe('my document.pdf');
        });

        it('should handle @file references with question mark', () => {
            const content = 'what is in @Q1 2026 - Lumo - Planning - OKR - Confluence.pdf?';
            const refs = parseFileReferences(content);
            expect(refs).toHaveLength(1);
            expect(refs[0].fileName).toBe('Q1 2026 - Lumo - Planning - OKR - Confluence.pdf');
        });

        it('should handle @file references with hyphens and spaces', () => {
            const content = 'hey Lumo, summarize @Global Signal Exchange - Proton AG - Proton redlines.docx for me please';
            const refs = parseFileReferences(content);
            expect(refs).toHaveLength(1);
            expect(refs[0].fileName).toBe('Global Signal Exchange - Proton AG - Proton redlines.docx');
        });

        it('should handle multiple @file references with complex names', () => {
            const content = 'compare @File-One 2024.pdf with @File Two (v2).docx';
            const refs = parseFileReferences(content);
            expect(refs).toHaveLength(2);
            expect(refs[0].fileName).toBe('File-One 2024.pdf');
            expect(refs[1].fileName).toBe('File Two (v2).docx');
        });

        it('should handle @file at end of message', () => {
            const content = 'please review @document.pdf';
            const refs = parseFileReferences(content);
            expect(refs).toHaveLength(1);
            expect(refs[0].fileName).toBe('document.pdf');
        });
    });
});
