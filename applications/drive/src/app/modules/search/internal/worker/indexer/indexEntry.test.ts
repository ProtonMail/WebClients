import type { TreeEventScopeId } from '../../shared/types';
import type { CoreNodeFields } from './indexEntry';
import { CORE_ATTRIBUTE_NAMES, createIndexEntry, extractExtension, normalizedFilenameForTag } from './indexEntry';

const okAuthor = (email: string) => ({ ok: true as const, value: email });

const makeNode = (overrides?: Partial<CoreNodeFields>): CoreNodeFields => ({
    uid: 'node-uid-1',
    name: 'document.pdf',
    type: 'file',
    creationTime: new Date('2025-01-15T10:00:00Z'),
    modificationTime: new Date('2025-02-20T14:30:00Z'),
    mediaType: 'application/pdf',
    keyAuthor: okAuthor('creator@proton.me'),
    activeRevisionContentAuthor: okAuthor('uploader@proton.me'),
    activeRevisionCreationTime: new Date('2025-02-20T14:30:00Z'),
    activeRevisionStorageSize: 1024,
    ...overrides,
});

const defaultParams = () => ({
    node: makeNode(),
    treeEventScopeId: 'scope-1' as TreeEventScopeId,
    parentPath: '/parent-uid-1/parent-uid-2',
    indexPopulatorId: 'populator-1',
    indexPopulatorVersion: 1,
    indexPopulatorGeneration: 1,
});

describe('createIndexEntry', () => {
    it('uses node.uid as documentId', () => {
        const entry = createIndexEntry(defaultParams());
        expect(entry.documentId).toBe('node-uid-1');
    });

    it('produces an index entry even if the filename strips to empty string', () => {
        const entry = createIndexEntry({ ...defaultParams(), node: makeNode({ name: '...' }) });
        expect(entry.documentId).toBe('node-uid-1');
        const filename = entry.attributes.find((a) => a.name === 'filename')?.value;
        expect(filename).toEqual({ kind: 'tag', value: '' });
    });

    it.each([
        // [input filename, expected normalized filename]
        ['a', 'a'],
        ['#1.png', '1png'],
        ['My file_name #1.png', 'myfilename1png'],
        ['Report.PDF', 'reportpdf'],
        ['hello world', 'helloworld'],
        ['file (1).txt', 'file1txt'],
        ['UPPERCASE', 'uppercase'],
        ['MiXeD CaSe.Doc', 'mixedcasedoc'],
        // i18n
        ['café résumé.pdf', 'caférésumépdf'],
        ['Ärzte-Bericht.pdf', 'ärzteberichtpdf'],
        ['文件 #1.txt', '文件1txt'],
        ['Résumé_final.pdf', 'résuméfinalpdf'],
        ['日本語ファイル.doc', '日本語ファイルdoc'],
        ['مستند.pdf', 'مستندpdf'],
        ['Ñoño (copia).txt', 'ñoñocopiatxt'],
    ])('normalizes filename %j to %j', (input, expected) => {
        const entry = createIndexEntry({ ...defaultParams(), node: makeNode({ name: input }) });
        const filename = entry.attributes.find((a) => a.name === 'filename')?.value;
        expect(filename).toEqual({ kind: 'tag', value: expected });
    });

    it('produces all core attributes', () => {
        const entry = createIndexEntry(defaultParams());
        const attrNames = entry.attributes.map((a) => a.name);
        for (const name of CORE_ATTRIBUTE_NAMES) {
            expect(attrNames).toContain(name);
        }
    });

    it('sets correct values for core attributes', () => {
        const params = defaultParams();
        const entry = createIndexEntry(params);
        const attr = (name: string) => entry.attributes.find((a) => a.name === name)?.value;

        expect(attr('nodeUid')).toEqual({ kind: 'tag', value: 'node-uid-1' });
        expect(attr('filename')).toEqual({ kind: 'tag', value: 'documentpdf' });
        expect(attr('filenameText')).toEqual({ kind: 'text', value: 'documentpdf' });
        expect(attr('path')).toEqual({ kind: 'tag', value: '/parent-uid-1/parent-uid-2' });
        expect(attr('treeEventScopeId')).toEqual({ kind: 'tag', value: 'scope-1' });
        expect(attr('indexPopulatorId')).toEqual({ kind: 'tag', value: 'populator-1' });
        expect(attr('nodeType')).toEqual({ kind: 'tag', value: 'file' });
        expect(attr('mediaType')).toEqual({ kind: 'tag', value: 'application/pdf' });
        expect(attr('sharedBy')).toEqual({ kind: 'tag', value: '' });
        expect(attr('isShared')).toEqual({ kind: 'boolean', value: false });
        expect(attr('isSharedPublicly')).toEqual({ kind: 'boolean', value: false });
        expect(attr('creationTime')).toEqual({
            kind: 'integer',
            value: BigInt(new Date('2025-01-15T10:00:00Z').getTime()),
        });
        expect(attr('modificationTime')).toEqual({
            kind: 'integer',
            value: BigInt(new Date('2025-02-20T14:30:00Z').getTime()),
        });
        expect(attr('trashTime')).toEqual({ kind: 'integer', value: 0n });
    });

    it('appends additional attributes after core ones', () => {
        const entry = createIndexEntry({
            ...defaultParams(),
            additionalAttributes: [
                { name: 'customTag', value: { kind: 'tag', value: 'hello' } },
                { name: 'isStarred', value: { kind: 'boolean', value: true } },
            ],
        });

        const attr = (name: string) => entry.attributes.find((a) => a.name === name)?.value;
        expect(attr('customTag')).toEqual({ kind: 'tag', value: 'hello' });
        expect(attr('isStarred')).toEqual({ kind: 'boolean', value: true });
        expect(entry.attributes).toHaveLength(CORE_ATTRIBUTE_NAMES.length + 2);
    });

    it('handles missing mediaType as empty string', () => {
        const entry = createIndexEntry({
            ...defaultParams(),
            node: makeNode({ mediaType: undefined }),
        });
        const mediaType = entry.attributes.find((a) => a.name === 'mediaType')?.value;
        expect(mediaType).toEqual({ kind: 'tag', value: '' });
    });

    it('defaults sharedBy to empty string when not provided', () => {
        const entry = createIndexEntry({
            ...defaultParams(),
            node: makeNode({ sharedBy: undefined }),
        });
        const sharedBy = entry.attributes.find((a) => a.name === 'sharedBy')?.value;
        expect(sharedBy).toEqual({ kind: 'tag', value: '' });
    });

    it('indexes sharedBy when provided', () => {
        const entry = createIndexEntry({
            ...defaultParams(),
            node: makeNode({ sharedBy: 'alice@proton.me' }),
        });
        const sharedBy = entry.attributes.find((a) => a.name === 'sharedBy')?.value;
        expect(sharedBy).toEqual({ kind: 'tag', value: 'alice@proton.me' });
    });

    it('indexes isShared when provided', () => {
        const entry = createIndexEntry({
            ...defaultParams(),
            node: makeNode({ isShared: true }),
        });
        const isShared = entry.attributes.find((a) => a.name === 'isShared')?.value;
        expect(isShared).toEqual({ kind: 'boolean', value: true });
    });

    it('defaults isShared to false when not provided', () => {
        const entry = createIndexEntry({
            ...defaultParams(),
            node: makeNode({ isShared: undefined }),
        });
        const isShared = entry.attributes.find((a) => a.name === 'isShared')?.value;
        expect(isShared).toEqual({ kind: 'boolean', value: false });
    });

    it('indexes isSharedPublicly when provided', () => {
        const entry = createIndexEntry({
            ...defaultParams(),
            node: makeNode({ isSharedPublicly: true }),
        });
        const isSharedPublicly = entry.attributes.find((a) => a.name === 'isSharedPublicly')?.value;
        expect(isSharedPublicly).toEqual({ kind: 'boolean', value: true });
    });

    it('defaults isSharedPublicly to false when not provided', () => {
        const entry = createIndexEntry({
            ...defaultParams(),
            node: makeNode({ isSharedPublicly: undefined }),
        });
        const isSharedPublicly = entry.attributes.find((a) => a.name === 'isSharedPublicly')?.value;
        expect(isSharedPublicly).toEqual({ kind: 'boolean', value: false });
    });

    it('extracts extension from filename as lowercase tag', () => {
        const entry = createIndexEntry({
            ...defaultParams(),
            node: makeNode({ name: 'Photo.JPG' }),
        });
        const ext = entry.attributes.find((a) => a.name === 'extension')?.value;
        expect(ext).toEqual({ kind: 'tag', value: 'jpg' });
    });

    it('produces correct attribute count with no additional attributes', () => {
        const entry = createIndexEntry(defaultParams());
        expect(entry.attributes).toHaveLength(CORE_ATTRIBUTE_NAMES.length);
    });
});

describe('normalizedFilename', () => {
    it('strips special chars and lowercases', () => {
        expect(normalizedFilenameForTag('My file_name #1.png')).toBe('myfilename1png');
    });

    it('preserves alphanumeric characters', () => {
        expect(normalizedFilenameForTag('abc123')).toBe('abc123');
    });

    it('returns empty for only special chars', () => {
        expect(normalizedFilenameForTag('# . _ -')).toBe('');
    });

    it('lowercases all characters', () => {
        expect(normalizedFilenameForTag('Report.PDF')).toBe('reportpdf');
    });

    it('preserves non-ASCII letters (i18n)', () => {
        expect(normalizedFilenameForTag('café résumé')).toBe('caférésumé');
        expect(normalizedFilenameForTag('Ärzte-Bericht.pdf')).toBe('ärzteberichtpdf');
    });

    it('preserves CJK and Cyrillic characters', () => {
        expect(normalizedFilenameForTag('文件 #1.txt')).toBe('文件1txt');
        expect(normalizedFilenameForTag('документ.pdf')).toBe('документpdf');
    });
});

describe('extractExtension', () => {
    it('extracts a simple extension', () => {
        expect(extractExtension('file.txt')).toBe('txt');
    });

    it('lowercases the extension', () => {
        expect(extractExtension('image.PNG')).toBe('png');
    });

    it('returns empty string for a file without extension', () => {
        expect(extractExtension('Makefile')).toBe('');
    });

    it('treats dotfiles as extensionless', () => {
        expect(extractExtension('.gitignore')).toBe('gitignore');
    });
});
