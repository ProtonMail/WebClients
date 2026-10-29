import {
    READ_SKILL_FILE_TOOL_NAME,
    type ReadFileResult,
    USE_SKILL_TOOL_NAME,
    createSkillToolExecutor,
} from './skillTool';

const call = (name: string, args: unknown) => ({
    id: 'call-1',
    name,
    arguments: typeof args === 'string' ? args : JSON.stringify(args),
});

describe('createSkillToolExecutor', () => {
    const loadSkill = jest.fn(async (handle: string) => ({
        instructions: handle === 'empty' ? '  ' : `Steps for ${handle}`,
        files: handle === 'pdf-tools' ? ['references/api.md', 'scripts/fill.py'] : [],
    }));
    const readFile = jest.fn(async (_handle: string, path: string): Promise<ReadFileResult> => {
        if (path === 'scripts/fill.py') {
            return { ok: true, path, content: 'print(1)', truncated: false, isScript: true };
        }
        if (path === 'logo.png') {
            return { ok: false, error: 'binary' };
        }
        return path === 'references/api.md'
            ? { ok: true, path, content: '# API', truncated: false, isScript: false }
            : { ok: false, error: 'not-found' };
    });
    const executor = createSkillToolExecutor({
        loadableHandles: ['pdf-tools', 'empty'],
        readableHandles: ['invoked-skill'],
        loadSkill,
        readFile,
    });

    beforeEach(() => {
        loadSkill.mockClear();
        readFile.mockClear();
    });

    it('advertises both tools without listing skill names in the schema', async () => {
        const tools = await executor.getClientTools!();
        expect(tools.map((tool) => tool.function.name)).toEqual([USE_SKILL_TOOL_NAME, READ_SKILL_FILE_TOOL_NAME]);
        expect(JSON.stringify(tools)).not.toContain('pdf-tools');
        expect(JSON.stringify(tools)).not.toContain('invoked-skill');
        expect(executor.canExecute(USE_SKILL_TOOL_NAME)).toBe(true);
        expect(executor.canExecute(READ_SKILL_FILE_TOOL_NAME)).toBe(true);
        expect(executor.canExecute('create_artifact')).toBe(false);
    });

    it('offers only read_skill_file when no skill can be loaded', async () => {
        const readOnly = createSkillToolExecutor({ loadableHandles: [], readableHandles: ['a'], loadSkill, readFile });
        const tools = await readOnly.getClientTools!();
        expect(tools.map((tool) => tool.function.name)).toEqual([READ_SKILL_FILE_TOOL_NAME]);
        expect(readOnly.canExecute(USE_SKILL_TOOL_NAME)).toBe(false);
    });

    describe(USE_SKILL_TOOL_NAME, () => {
        it('returns the instructions and files of a known skill, tolerating a leading slash and case', async () => {
            const [result] = await executor.execute([call(USE_SKILL_TOOL_NAME, { name: '/PDF-Tools' })]);
            expect(result.is_error).toBeUndefined();
            const content = JSON.parse(result.content);
            expect(content).toMatchObject({
                ok: true,
                skill: 'pdf-tools',
                instructions: 'Steps for pdf-tools',
                files: ['references/api.md', 'scripts/fill.py'],
            });
            expect(content.message).toContain(READ_SKILL_FILE_TOOL_NAME);
            expect(loadSkill).toHaveBeenCalledWith('pdf-tools');
        });

        it('leaves out the file list when the skill has no files', async () => {
            const loadSkillWithoutFiles = jest.fn(async () => ({ instructions: 'Steps', files: [] }));
            const plain = createSkillToolExecutor({
                loadableHandles: ['plain'],
                loadSkill: loadSkillWithoutFiles,
                readFile,
            });
            const [result] = await plain.execute([call(USE_SKILL_TOOL_NAME, { name: 'plain' })]);
            expect(JSON.parse(result.content)).not.toHaveProperty('files');
        });

        it('rejects skills outside the loadable list without loading them', async () => {
            const results = await executor.execute([
                call(USE_SKILL_TOOL_NAME, { name: 'secret-skill' }),
                call(USE_SKILL_TOOL_NAME, { name: 'invoked-skill' }),
            ]);
            expect(results.map(({ is_error }) => is_error)).toEqual([true, true]);
            expect(JSON.parse(results[0].content).error).toContain('Use one of: pdf-tools, empty');
            expect(loadSkill).not.toHaveBeenCalled();
        });

        it('rejects malformed arguments', async () => {
            const results = await executor.execute([
                call(USE_SKILL_TOOL_NAME, 'not json'),
                call(USE_SKILL_TOOL_NAME, { skill: 'pdf-tools' }),
            ]);
            expect(results.map(({ is_error }) => is_error)).toEqual([true, true]);
        });

        it('reports a skill without instructions as an error', async () => {
            const [result] = await executor.execute([call(USE_SKILL_TOOL_NAME, { name: 'empty' })]);
            expect(result.is_error).toBe(true);
        });

        it('reports a failed load as an error', async () => {
            loadSkill.mockRejectedValueOnce(new Error('locked'));
            const [result] = await executor.execute([call(USE_SKILL_TOOL_NAME, { name: 'pdf-tools' })]);
            expect(result.is_error).toBe(true);
        });
    });

    describe(READ_SKILL_FILE_TOOL_NAME, () => {
        it('reads a file of a loadable or invoked skill', async () => {
            const [loadable, invoked] = await executor.execute([
                call(READ_SKILL_FILE_TOOL_NAME, { skill: 'pdf-tools', path: 'references/api.md' }),
                call(READ_SKILL_FILE_TOOL_NAME, { skill: '/Invoked-Skill', path: 'references/api.md' }),
            ]);
            expect(JSON.parse(loadable.content)).toEqual({
                ok: true,
                skill: 'pdf-tools',
                path: 'references/api.md',
                content: '# API',
            });
            expect(invoked.is_error).toBeUndefined();
            expect(readFile).toHaveBeenLastCalledWith('invoked-skill', 'references/api.md');
        });

        it('says that scripts are not run', async () => {
            const [result] = await executor.execute([
                call(READ_SKILL_FILE_TOOL_NAME, { skill: 'pdf-tools', path: 'scripts/fill.py' }),
            ]);
            expect(JSON.parse(result.content).message).toContain("can't be run");
        });

        it('reports missing and binary files', async () => {
            const results = await executor.execute([
                call(READ_SKILL_FILE_TOOL_NAME, { skill: 'pdf-tools', path: 'nope.md' }),
                call(READ_SKILL_FILE_TOOL_NAME, { skill: 'pdf-tools', path: 'logo.png' }),
            ]);
            expect(results.map(({ is_error }) => is_error)).toEqual([true, true]);
            expect(JSON.parse(results[0].content).error).toContain('file list');
            expect(JSON.parse(results[1].content).error).toContain('not a text file');
        });

        it('rejects unknown skills and malformed arguments without reading', async () => {
            const results = await executor.execute([
                call(READ_SKILL_FILE_TOOL_NAME, { skill: 'secret-skill', path: 'a.md' }),
                call(READ_SKILL_FILE_TOOL_NAME, { skill: 'pdf-tools' }),
            ]);
            expect(results.map(({ is_error }) => is_error)).toEqual([true, true]);
            expect(readFile).not.toHaveBeenCalled();
        });
    });
});
