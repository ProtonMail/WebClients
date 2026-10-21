import { SpaceType, cleanSerializedSpace, cleanSpace, splitSpace } from './types';
import type { Space } from './types';

const baseSpaceFields = {
    createdAt: 'created',
    updatedAt: 'updated',
    spaceKey: 'key',
};

function expectSpaceTypeIsPreserved(space: Space) {
    expect(cleanSpace(space)).toEqual(space);
    expect(splitSpace(space).spacePub.type).toBe(space.type);
    expect(splitSpace(space).spacePriv).not.toHaveProperty('type');
    expect(cleanSerializedSpace({ ...space, wrappedSpaceKey: 'wrapped' }).type).toBe(space.type);
    expect(cleanSerializedSpace({ ...space, deleted: true }).type).toBe(space.type);
}

describe('space field helpers', () => {
    it('keeps the simple space type when cleaning spaces', () => {
        expectSpaceTypeIsPreserved({
            id: 'simple-space',
            type: SpaceType.Simple,
            ...baseSpaceFields,
        });
    });

    it('keeps the project space type when cleaning spaces', () => {
        expectSpaceTypeIsPreserved({
            id: 'project-space',
            type: SpaceType.Project,
            ...baseSpaceFields,
            projectName: 'Research',
            projectInstructions: 'Summarize sources',
            projectIcon: 'science',
        });
    });
});
