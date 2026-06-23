/**
 * Instruction prompt used for the final, LLM-backed compaction step. Modelled on
 * Claude Code's structured summary sections, trimmed for a chat assistant. The
 * preamble/trailer keep the summarizer from invoking tools or answering the
 * conversation — it must only produce a summary.
 */

const PREAMBLE =
    'You are compacting a conversation to fit within a context window. ' +
    'Do NOT continue the conversation, answer the user, or call any tools. ' +
    'Produce ONLY a faithful, information-dense summary of the conversation so far.';

const SECTIONS = `Summarize the conversation using these sections, omitting any that do not apply:

1. Primary request and intent — what the user is ultimately trying to accomplish.
2. Key facts and decisions — concrete details, constraints, and conclusions established.
3. Files, data, and tools used — important names, identifiers, and notable results.
4. Errors and resolutions — problems hit and how they were fixed.
5. Current state — where things stand right now.
6. Pending work / next steps — anything outstanding.

Preserve specific values (names, numbers, IDs, code, decisions) verbatim where they matter. Be concise but lossless on anything required to continue the task.`;

const TRAILER =
    'Output the summary as plain prose under the headings above. ' +
    'Do not add commentary before or after the summary.';

export function buildCompactionPrompt(transcript: string, customInstructions?: string): string {
    const parts = [PREAMBLE, SECTIONS];
    if (customInstructions?.trim()) {
        parts.push(`Additional guidance: ${customInstructions.trim()}`);
    }
    parts.push('Conversation to summarize:\n\n' + transcript);
    parts.push(TRAILER);
    return parts.join('\n\n');
}
