import type { TreeEventScopeId } from '../../shared/types';
import type { CoreNodeFields } from './indexEntry';
import { CORE_ATTRIBUTE_NAMES, createIndexEntry } from './indexEntry';

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
        expect(attr('filename')).toEqual({ kind: 'text', value: 'document.pdf' });
        expect(attr('path')).toEqual({ kind: 'tag', value: '/parent-uid-1/parent-uid-2' });
        expect(attr('treeEventScopeId')).toEqual({ kind: 'tag', value: 'scope-1' });
        expect(attr('indexPopulatorId')).toEqual({ kind: 'tag', value: 'populator-1' });
        expect(attr('nodeType')).toEqual({ kind: 'tag', value: 'file' });
        expect(attr('mediaType')).toEqual({ kind: 'tag', value: 'application/pdf' });
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
});
