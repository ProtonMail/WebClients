/**
 * Utility functions for parsing and resolving file references in messages
 * Supports @file "filename" or @file filename syntax
 */

export interface FileReference {
    match: string; // The full match including @file
    fileName: string; // The extracted filename
    startIndex: number;
    endIndex: number;
}

/**
 * Parse file references from message content
 * Matches patterns like: @file "filename" or @file filename
 */
export function parseFileReferences(content: string): FileReference[] {
    const references: FileReference[] = [];
    
    // Match @file "filename" or @file filename
    // Supports quoted filenames with spaces: @file "my file.txt"
    // Or unquoted filenames: @file myfile.txt
    const pattern = /@file\s+(?:"([^"]+)"|([^\s@]+))/g;
    
    let match;
    while ((match = pattern.exec(content)) !== null) {
        const fileName = match[1] || match[2]; // Quoted or unquoted filename
        references.push({
            match: match[0],
            fileName: fileName.trim(),
            startIndex: match.index,
            endIndex: match.index + match[0].length,
        });
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
): Promise<{ content: string; referencedFiles: Array<{ fileName: string; content: string }> }> {
    const references = parseFileReferences(content);
    const referencedFiles: Array<{ fileName: string; content: string }> = [];
    
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

