import type { TreeEventScopeId } from '../../shared/types';
import type { CoreNodeFields } from './indexEntry';
import { CORE_ATTRIBUTE_NAMES, createIndexEntry, extractExtension } from './indexEntry';

const makeNode = (overrides?: Partial<CoreNodeFields>): CoreNodeFields => ({
    uid: 'node-uid-1',
    name: 'document.pdf',
    type: 'file',
    creationTime: new Date('2025-01-15T10:00:00Z'),
    modificationTime: new Date('2025-02-20T14:30:00Z'),
    mediaType: 'application/pdf',
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
        expect(attr('filename')).toEqual({ kind: 'tag', value: 'document.pdf' });
        expect(attr('filenameText')).toEqual({ kind: 'text', value: 'document.pdf' });
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
