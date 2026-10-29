import { convertSkillFileContentFromApi, convertSkillsFromApi } from './skills';

const apiSkill = (overrides: Record<string, unknown> = {}) => ({
    ID: 'remote-1',
    SkillTag: 'tag-1',
    CreateTime: '2026-10-23T10:00:00+00:00',
    UpdateTime: '2026-10-23T11:00:00+00:00',
    DeleteTime: null,
    SkillKey: 'a2V5',
    Encrypted: 'ZW5j',
    Files: [
        { ID: 'remote-file-1', SkillID: 'remote-1', SkillFileTag: 'file-1', CreateTime: '2026-10-23T10:00:00+00:00' },
    ],
    ...overrides,
});

describe('convertSkillsFromApi', () => {
    it('converts skills and their files', () => {
        expect(convertSkillsFromApi([apiSkill()])).toEqual([
            {
                remoteId: 'remote-1',
                tag: 'tag-1',
                createdAt: '2026-10-23T10:00:00.000Z',
                updatedAt: '2026-10-23T11:00:00.000Z',
                wrappedSkillKey: 'a2V5',
                encrypted: 'ZW5j',
                files: [{ remoteId: 'remote-file-1', tag: 'file-1', createdAt: '2026-10-23T10:00:00.000Z' }],
            },
        ]);
    });

    it('skips deleted skills', () => {
        expect(convertSkillsFromApi([apiSkill({ DeleteTime: '2026-10-23T12:00:00+00:00', Encrypted: null })])).toEqual(
            []
        );
    });

    it('treats a missing file list as empty', () => {
        expect(convertSkillsFromApi([apiSkill({ Files: undefined })])[0].files).toEqual([]);
    });

    it('rejects malformed input', () => {
        expect(() => convertSkillsFromApi({})).toThrow();
        expect(() => convertSkillsFromApi([apiSkill({ SkillTag: '' })])).toThrow();
        expect(() => convertSkillsFromApi([apiSkill({ UpdateTime: 'not a date' })])).toThrow();
        expect(() => convertSkillsFromApi([apiSkill({ Files: [{ ID: 'x' }] })])).toThrow();
    });
});

describe('convertSkillFileContentFromApi', () => {
    it('returns the encrypted content', () => {
        expect(convertSkillFileContentFromApi({ ID: 'f', Encrypted: 'ZW5j', DeleteTime: null })).toBe('ZW5j');
    });

    it('returns null for deleted files', () => {
        expect(convertSkillFileContentFromApi({ ID: 'f', Encrypted: null, DeleteTime: '2026-10-23' })).toBeNull();
    });
});
