import type { ClientToolExecutor, ClientToolResult } from '@proton/lumo-api-client/core/client-tools';
import type { ChatCompletionsFunctionTool } from '@proton/lumo-api-client/types-api';

export const USE_SKILL_TOOL_NAME = 'use_skill';
export const READ_SKILL_FILE_TOOL_NAME = 'read_skill_file';

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

const readSkillFileTool = {
    type: 'function',
    function: {
        name: READ_SKILL_FILE_TOOL_NAME,
        description:
            "Read a file bundled with one of the user's skills, such as a reference document or template its " +
            "instructions point to. Only paths from the skill's file list can be read. Scripts can be read but " +
            "not run. Never mention this tool's name to the user.",
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
}: SkillToolOptions): ClientToolExecutor => {
    const loadable = new Set(loadableHandles);
    const readable = new Set([...loadableHandles, ...readableHandles]);
    const tools: ChatCompletionsFunctionTool[] = [
        ...(loadable.size ? [useSkillTool] : []),
        ...(readable.size ? [readSkillFileTool] : []),
    ];
    const toolNames = new Set(tools.map((tool) => tool.function.name));

    const runUseSkill = async (args: Record<string, unknown> | undefined): Promise<ClientToolResult> => {
        if (typeof args?.name !== 'string') {
            return errorResult('arguments: expected {"name": "<skill name>"}');
        }
        const handle = normalizeHandle(args.name);
        if (!loadable.has(handle)) {
            return errorResult(`Unknown skill "${echo(args.name)}". Use one of: ${loadableHandles.join(', ')}`);
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
                    ? `Follow these instructions for this request. When they refer to one of the files, read it with ${READ_SKILL_FILE_TOOL_NAME} instead of guessing its contents. Scripts can't be run.`
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
                    message:
                        "This is a script. It can't be run here: use it as a reference, or give it to the user to run.",
                }),
            }),
        };
    };

    return {
        getClientTools: async () => tools,
        canExecute: (name) => toolNames.has(name),
        execute: async (calls) =>
            Promise.all(
                calls.map((call) => {
                    const args = parseArguments(call.arguments);
                    return call.name === READ_SKILL_FILE_TOOL_NAME ? runReadFile(args) : runUseSkill(args);
                })
            ),
    };
};
