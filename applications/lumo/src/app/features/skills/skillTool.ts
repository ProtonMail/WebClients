import type { ClientToolExecutor, ClientToolResult } from '@proton/lumo-api-client/core/client-tools';
import type { ChatCompletionsFunctionTool } from '@proton/lumo-api-client/types-api';

export const USE_SKILL_TOOL_NAME = 'use_skill';
export const READ_SKILL_FILE_TOOL_NAME = 'read_skill_file';
const EXECUTE_SKILL_SCRIPT_TOOL_NAME = 'execute_skill_script';

const MAX_ECHOED_CHARS = 64;
const MAX_PATH_CHARS = 512;

type LoadedSkill = { instructions: string; files: string[] };

export type ReadFileResult =
    | { ok: true; path: string; content: string; truncated: boolean; isScript: boolean }
    | { ok: false; error: 'unknown-skill' | 'not-found' | 'binary' };

interface SkillToolOptions {
    /** Handles of the skills the model may load with use_skill; anything else is rejected. */
    loadableHandles: string[];
    /** Handles whose files the model may read, on top of the loadable ones (skills the user invoked). */
    readableHandles?: string[];
    loadSkill: (handle: string) => Promise<LoadedSkill>;
    readFile: (handle: string, path: string) => Promise<ReadFileResult>;
    executeScript?: (handle: string, path: string, args: string[]) => Promise<unknown>;
}

const errorResult = (error: string): ClientToolResult => ({
    is_error: true,
    content: JSON.stringify({ ok: false, error }),
});

const parseArguments = (rawArguments: string): Record<string, unknown> | undefined => {
    try {
        const args: unknown = JSON.parse(rawArguments);
        return typeof args === 'object' && args !== null ? (args as Record<string, unknown>) : undefined;
    } catch {
        return undefined;
    }
};

const normalizeHandle = (name: string) => name.trim().replace(/^\//, '').toLowerCase();

const echo = (value: string) => value.slice(0, MAX_ECHOED_CHARS);

/*
 * Skill names are private, but tool definitions travel outside the encrypted turns, so the schemas
 * below must never list them. The model learns the names from the catalogue in the system turn.
 */
const useSkillTool = {
    type: 'function',
    function: {
        name: USE_SKILL_TOOL_NAME,
        description:
            "Load the full instructions of one of the user's skills listed under Available skills. Call it " +
            'before answering a request that a skill covers, then follow the instructions it returns. Never ' +
            "mention this tool's name to the user.",
        parameters: {
            type: 'object',
            properties: {
                name: { type: 'string', description: 'The skill name, exactly as listed under Available skills.' },
            },
            required: ['name'],
            additionalProperties: false,
        },
    },
} satisfies ChatCompletionsFunctionTool;

const executeScriptTool = {
    type: 'function',
    function: {
        name: EXECUTE_SKILL_SCRIPT_TOOL_NAME,
        description:
            "Execute a bundled skill script through the available host runtime. Use a path from the skill's file list and pass arguments as separate strings. Do not copy scripts, create artifacts, or construct shell commands to execute them.",
        parameters: {
            type: 'object',
            properties: {
                skill: { type: 'string', description: 'Skill name.' },
                path: { type: 'string', description: 'Bundled script path from the skill file list.' },
                args: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Script arguments, without an interpreter or script filename.',
                },
            },
            required: ['skill', 'path', 'args'],
            additionalProperties: false,
        },
    },
} satisfies ChatCompletionsFunctionTool;

const readSkillFileTool = {
    type: 'function',
    function: {
        name: READ_SKILL_FILE_TOOL_NAME,
        description:
            "Read a file bundled with one of the user's skills, such as a reference document or template its " +
            "instructions point to. Only paths from the skill's file list can be read. Use execute_skill_script for scripts when available. Never mention this tool's name to the user.",
        parameters: {
            type: 'object',
            properties: {
                skill: { type: 'string', description: 'The skill name the file belongs to.' },
                path: {
                    type: 'string',
                    description: "The file's path as given in the skill's file list or instructions.",
                },
            },
            required: ['skill', 'path'],
            additionalProperties: false,
        },
    },
} satisfies ChatCompletionsFunctionTool;

export const createSkillToolExecutor = ({
    loadableHandles,
    readableHandles = [],
    loadSkill,
    readFile,
    executeScript,
}: SkillToolOptions): ClientToolExecutor => {
    const loadable = new Set(loadableHandles);
    const readable = new Set([...loadableHandles, ...readableHandles]);
    const tools: ChatCompletionsFunctionTool[] = [
        ...(loadable.size ? [useSkillTool] : []),
        ...(readable.size ? [readSkillFileTool] : []),
        ...(readable.size && executeScript ? [executeScriptTool] : []),
    ];
    const toolNames = new Set(tools.map((tool) => tool.function.name));

    const runUseSkill = async (args: Record<string, unknown> | undefined): Promise<ClientToolResult> => {
        if (typeof args?.name !== 'string') {
            return errorResult('arguments: expected {"name": "<skill name>"}');
        }
        const handle = normalizeHandle(args.name);
        // Invoked skills are absent from the catalogue because their instructions are already
        // supplied, but remain valid when the model explicitly requests them again.
        if (!readable.has(handle)) {
            return errorResult(`Unknown skill "${echo(args.name)}". Use one of: ${[...readable].join(', ')}`);
        }
        const loaded = await loadSkill(handle).catch((): LoadedSkill => ({ instructions: '', files: [] }));
        if (!loaded.instructions.trim()) {
            return errorResult(`The skill "${handle}" has no instructions. Answer without it.`);
        }
        return {
            content: JSON.stringify({
                ok: true,
                skill: handle,
                instructions: loaded.instructions,
                ...(loaded.files.length && { files: loaded.files }),
                message: loaded.files.length
                    ? `Follow these instructions for this request. Read references with ${READ_SKILL_FILE_TOOL_NAME}. ${executeScript ? `Run bundled scripts with execute_skill_script using skill "${handle}" and paths from the file list; do not copy scripts or construct shell commands.` : "Scripts can't be run."}`
                    : 'Follow these instructions for this request.',
            }),
        };
    };

    const runReadFile = async (args: Record<string, unknown> | undefined): Promise<ClientToolResult> => {
        if (typeof args?.skill !== 'string' || typeof args.path !== 'string') {
            return errorResult('arguments: expected {"skill": "<skill name>", "path": "<file path>"}');
        }
        const handle = normalizeHandle(args.skill);
        if (!readable.has(handle)) {
            return errorResult(`Unknown skill "${echo(args.skill)}".`);
        }
        const path = args.path.slice(0, MAX_PATH_CHARS);
        const result = await readFile(handle, path).catch((): ReadFileResult => ({ ok: false, error: 'not-found' }));
        if (!result.ok) {
            const reasons = {
                'unknown-skill': `Unknown skill "${handle}".`,
                'not-found': `The skill "${handle}" has no file "${echo(path)}". Use a path from its file list.`,
                binary: `"${echo(path)}" is not a text file, so it can't be read. Answer without it.`,
            };
            return errorResult(reasons[result.error]);
        }
        return {
            content: JSON.stringify({
                ok: true,
                skill: handle,
                path: result.path,
                content: result.content,
                ...(result.truncated && { truncated: true }),
                ...(result.isScript && {
                    message: executeScript
                        ? 'Run this bundled script with execute_skill_script, passing its file-list path and arguments.'
                        : "This is a script. It can't be run here: use it as a reference, or give it to the user to run.",
                }),
            }),
        };
    };

    const runScript = async (args: Record<string, unknown> | undefined): Promise<ClientToolResult> => {
        if (!executeScript) return errorResult('Script execution is unavailable in this environment');
        if (
            typeof args?.skill !== 'string' ||
            typeof args.path !== 'string' ||
            !Array.isArray(args.args) ||
            args.args.length > 256 ||
            args.args.some((arg) => typeof arg !== 'string')
        ) {
            return errorResult('Expected skill, path, and an array of string arguments');
        }
        const handle = normalizeHandle(args.skill);
        if (!readable.has(handle)) {
            return errorResult(`Unknown skill "${echo(args.skill)}". Use one of: ${[...readable].join(', ')}`);
        }
        try {
            return { content: JSON.stringify(await executeScript(handle, args.path, args.args as string[])) };
        } catch (error) {
            return errorResult(
                typeof error === 'string' ? error : error instanceof Error ? error.message : 'Script execution failed'
            );
        }
    };

    return {
        getClientTools: async () => tools,
        canExecute: (name) => toolNames.has(name),
        execute: async (calls) =>
            Promise.all(
                calls.map((call) => {
                    const args = parseArguments(call.arguments);
                    if (call.name === EXECUTE_SKILL_SCRIPT_TOOL_NAME) return runScript(args);
                    return call.name === READ_SKILL_FILE_TOOL_NAME ? runReadFile(args) : runUseSkill(args);
                })
            ),
    };
};
