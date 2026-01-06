/**
 * Utility functions for parsing and resolving file references in messages
 * Supports:
 * - @file "filename" or @file filename syntax (legacy)
 * - @filename.ext syntax (direct mention, used by autocomplete)
 */

export interface FileReference {
    match: string; // The full match including @file
    fileName: string; // The extracted filename
    startIndex: number;
    endIndex: number;
}

/**
 * Parse file references from message content
 * Matches patterns like:
 * - @file "filename" or @file filename (legacy format)
 * - @filename.ext (direct @ mention format used by autocomplete)
 */
export function parseFileReferences(content: string): FileReference[] {
    const references: FileReference[] = [];

    // Pattern 1: @file "filename" or @file filename (legacy format)
    // Supports quoted filenames with spaces: @file "my file.txt"
    // Or unquoted filenames: @file myfile.txt
    const legacyPattern = /@file\s+(?:"([^"]+)"|([^\s@]+))/g;

    let match: RegExpExecArray | null;
    while ((match = legacyPattern.exec(content)) !== null) {
        const fileName = match[1] || match[2];
        const matchText = match[0];
        const matchIndex = match.index;
        references.push({
            match: matchText,
            fileName: fileName.trim(),
            startIndex: matchIndex,
            endIndex: matchIndex + matchText.length,
        });
    }

    const directPattern = /@([^\s@"]+\.(?:pdf|doc|docx|txt|md|csv|xls|xlsx|json|html|xml|rtf|ppt|pptx|png|jpg|jpeg|gif|webp|svg))/gi;

    while ((match = directPattern.exec(content)) !== null) {
        const fileName = match[1]; // Filename without @
        const matchText = match[0];
        const matchIndex = match.index;
        const overlaps = references.some(
            (ref) => matchIndex >= ref.startIndex && matchIndex < ref.endIndex
        );
        if (!overlaps) {
            references.push({
                match: matchText,
                fileName: fileName.trim(),
                startIndex: matchIndex,
                endIndex: matchIndex + matchText.length,
            });
        }
    }

    return references;
}

/**
 * Replace file references with file contents in message
 * Returns the updated content and list of referenced files
 */
export async function resolveFileReferences(
    content: string,
    fileResolver: (fileName: string) => Promise<{ content: string; fileName: string } | null>
): Promise<{ content: string; referencedFiles: { fileName: string; content: string }[] }> {
    const references = parseFileReferences(content);
    const referencedFiles: { fileName: string; content: string }[] = [];

    if (references.length === 0) {
        return { content, referencedFiles: [] };
    }

    // Resolve all file references
    const resolvedFiles = await Promise.all(
        references.map(async (ref) => {
            const file = await fileResolver(ref.fileName);
            if (file) {
                referencedFiles.push({ fileName: file.fileName, content: file.content });
                return { ref, file };
            }
            return null;
        })
    );

    // Replace references in reverse order to maintain indices
    let updatedContent = content;
    for (let i = resolvedFiles.length - 1; i >= 0; i--) {
        const resolved = resolvedFiles[i];
        if (resolved) {
            const { ref, file } = resolved;
            // Replace @file reference with file contents in a code block
            const replacement = `\n\n[File: ${file.fileName}]\n\`\`\`\n${file.content}\n\`\`\`\n\n`;
            updatedContent =
                updatedContent.slice(0, ref.startIndex) +
                replacement +
                updatedContent.slice(ref.endIndex);
        }
    }

    return { content: updatedContent, referencedFiles };
}

