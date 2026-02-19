import type { GenerationResponseMessage } from './types';
import { isGenerationResponseMessage } from './types';

/**
 * Processes streaming data chunks from the API
 */
export class StreamProcessor {
    private leftover = ''; // Remember last line if it was incomplete

    /**
     * Process a chunk of streaming data
     * @param chunk Raw string chunk from the stream
     * @returns Array of parsed messages
     */
    processChunk(chunk: string): GenerationResponseMessage[] {
        const lines = (this.leftover + chunk).split('\n');
        const lastLine = lines.pop() || '';
        const parsedData: GenerationResponseMessage[] = [];

        for (const line of lines) {
            if (!line.match(/^data:\s*/)) continue;

            try {
                const jsonStr = line.replace(/^data:\s*/, '');
                const item = JSON.parse(jsonStr);
                console.log('[STREAM] Parsed item:', item.type, item);
                if (!isGenerationResponseMessage(item)) {
                    console.warn('Unexpected format for json payload received from API server, ignoring', item);
                    continue;
                }
                parsedData.push(item);
            } catch (error) {
                console.warn('Error parsing a data line from chat endpoint', error);
                continue;
            }
        }

        if (lastLine.match(/^data:\s*/)) {
            try {
                const jsonStr = lastLine.replace(/^data:\s*/, '');
                const item = JSON.parse(jsonStr);
                if (isGenerationResponseMessage(item)) {
                    parsedData.push(item);
                } else {
                    console.warn('Unexpected format for json payload received from API server, ignoring');
                }
            } catch {
                this.leftover = lastLine;
            }
        } else {
            this.leftover = lastLine;
        }

        return parsedData;
    }

    /**
     * Finalize processing and return any remaining messages
     * @returns Array of any remaining parsed messages
     */
    finalize(): GenerationResponseMessage[] {
        if (!this.leftover || !this.leftover.match(/^data:\s*/)) return [];

        try {
            const jsonStr = this.leftover.replace(/^data:\s*/, '');
            const item = JSON.parse(jsonStr);
            if (isGenerationResponseMessage(item)) {
                return [item];
            }
        } catch {
            // Ignore parse errors in finalize
        }

        return [];
    }

    /**
     * Reset the processor state
     */
    reset(): void {
        this.leftover = '';
    }
}
