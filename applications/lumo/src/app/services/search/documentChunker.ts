import type { DriveDocument } from '../../types/documents';

const CHARS_PER_TOKEN = 4;
const MAX_CHUNK_TOKENS = 6000;
const OVERLAP_TOKENS = 500;
const CHUNKING_THRESHOLD_TOKENS = 20000;

export function estimateTokens(text: string): number {
    return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export function needsChunking(content: string): boolean {
    return estimateTokens(content) > CHUNKING_THRESHOLD_TOKENS;
}

/**
 * Find semantic boundaries in text (paragraphs, sections, etc.)
 * Returns array of [start, end] positions for each section
 */
function findSemanticBoundaries(text: string): number[] {
    const boundaries: number[] = [0];
    
    // Look for section headers (markdown-style or numbered sections)
    const sectionPattern = /\n(?=#{1,3}\s|\d+\.\s|[A-Z][A-Z\s]+:?\n)/g;
    let match;
    while ((match = sectionPattern.exec(text)) !== null) {
        boundaries.push(match.index + 1); // +1 to start after the newline
    }
    
    // Also look for double newlines (paragraph breaks) as fallback boundaries
    const paragraphPattern = /\n\n+/g;
    while ((match = paragraphPattern.exec(text)) !== null) {
        // Only add if not too close to existing boundary
        const pos = match.index + match[0].length;
        const nearExisting = boundaries.some(b => Math.abs(b - pos) < 100);
        if (!nearExisting) {
            boundaries.push(pos);
        }
    }
    
    boundaries.push(text.length);
    return boundaries.sort((a, b) => a - b);
}

/**
 * Extract a title or context for a chunk
 */
function extractChunkTitle(text: string, startPos: number): string | undefined {
    // Look for the first heading or significant line
    const textSlice = text.slice(startPos, startPos + 500);
    
    // Try to find a markdown heading
    const headingMatch = textSlice.match(/^#{1,3}\s+(.+?)[\n\r]/);
    if (headingMatch) {
        return headingMatch[1].trim().slice(0, 100);
    }
    
    // Try to find a numbered section
    const numberedMatch = textSlice.match(/^(\d+\.[\d.]*\s+.+?)[\n\r]/);
    if (numberedMatch) {
        return numberedMatch[1].trim().slice(0, 100);
    }
    
    // Use first line as fallback
    const firstLine = textSlice.split(/[\n\r]/)[0]?.trim();
    if (firstLine && firstLine.length > 10 && firstLine.length < 100) {
        return firstLine;
    }
    
    return undefined;
}

export function chunkDocument(doc: DriveDocument): DriveDocument[] {
    const content = doc.content;
    
    if (!needsChunking(content)) {
        return [doc];
    }
    
    const maxChunkChars = MAX_CHUNK_TOKENS * CHARS_PER_TOKEN;
    const overlapChars = OVERLAP_TOKENS * CHARS_PER_TOKEN;
    
    const boundaries = findSemanticBoundaries(content);
    const chunks: DriveDocument[] = [];
    
    let chunkStart = 0;
    let chunkContent = '';
    let chunkIndex = 0;
    
    for (let i = 0; i < boundaries.length - 1; i++) {
        const sectionStart = boundaries[i];
        const sectionEnd = boundaries[i + 1];
        const section = content.slice(sectionStart, sectionEnd);
        
        // If adding this section would exceed max size, finalize current chunk
        if (chunkContent.length > 0 && chunkContent.length + section.length > maxChunkChars) {
            // Create chunk
            const chunkTitle = extractChunkTitle(content, chunkStart);
            chunks.push({
                ...doc,
                id: `${doc.id}__chunk_${chunkIndex}`,
                content: chunkContent.trim(),
                isChunk: true,
                parentDocumentId: doc.id,
                chunkIndex,
                chunkTitle,
            });
            
            chunkIndex++;
            
            // Start new chunk with overlap from end of previous
            const overlapStart = Math.max(0, chunkContent.length - overlapChars);
            chunkContent = chunkContent.slice(overlapStart);
            chunkStart = sectionStart - chunkContent.length;
        }
        
        chunkContent += section;
        
        // If this section alone is too big, split it further
        if (section.length > maxChunkChars) {
            // Split by sentences or fixed size
            const sentences = section.split(/(?<=[.!?])\s+/);
            let subChunk = '';
            
            for (const sentence of sentences) {
                if (subChunk.length + sentence.length > maxChunkChars && subChunk.length > 0) {
                    const chunkTitle = extractChunkTitle(subChunk, 0);
                    chunks.push({
                        ...doc,
                        id: `${doc.id}__chunk_${chunkIndex}`,
                        content: subChunk.trim(),
                        isChunk: true,
                        parentDocumentId: doc.id,
                        chunkIndex,
                        chunkTitle,
                    });
                    chunkIndex++;
                    subChunk = sentence;
                } else {
                    subChunk += (subChunk ? ' ' : '') + sentence;
                }
            }
            chunkContent = subChunk;
        }
    }
    
    // Don't forget the last chunk
    if (chunkContent.trim().length > 0) {
        const chunkTitle = extractChunkTitle(content, chunkStart);
        chunks.push({
            ...doc,
            id: `${doc.id}__chunk_${chunkIndex}`,
            content: chunkContent.trim(),
            isChunk: true,
            parentDocumentId: doc.id,
            chunkIndex,
            chunkTitle,
        });
        chunkIndex++;
    }
    
    const totalChunks = chunks.length;
    chunks.forEach(chunk => {
        chunk.totalChunks = totalChunks;
    });
    
    return chunks;
}

/**
 * Merge chunks from the same document in search results
 * Returns deduplicated results with best chunk per document
 */
export function mergeChunkResults<T extends { id: string; score: number; parentDocumentId?: string }>(
    results: T[]
): T[] {
    const docBestChunk = new Map<string, T>();
    
    for (const result of results) {
        // Use parentDocumentId if it's a chunk, otherwise use the document id
        const docId = result.parentDocumentId || result.id.replace(/__chunk_\d+$/, '');
        
        const existing = docBestChunk.get(docId);
        if (!existing || result.score > existing.score) {
            docBestChunk.set(docId, result);
        }
    }
    
    return Array.from(docBestChunk.values());
}

