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

    const extensions = 'pdf|doc|docx|txt|md|csv|xls|xlsx|json|html|xml|rtf|ppt|pptx|png|jpg|jpeg|gif|webp|svg';
    const directPattern = new RegExp(`@([^@/]+?\\.(${extensions}))(?=\\s|$|[,.!?;:)])`, 'gi');

    while ((match = directPattern.exec(content)) !== null) {
        const fileName = match[1].trim(); // Filename without @, trimmed
        const matchText = match[0].trim(); // The full match including @
        const matchIndex = match.index;
        const overlaps = references.some(
            (ref) => matchIndex >= ref.startIndex && matchIndex < ref.endIndex
        );

        if (!overlaps) {
            references.push({
                match: matchText,
                fileName: fileName,
                startIndex: matchIndex,
                endIndex: matchIndex + matchText.length,
            });
        }
    }
    return references;
}

