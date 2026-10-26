import { SpaceType, cleanSerializedSpace, cleanSpace, splitSpace } from './types';
import type { Space } from './types';

const baseSpaceFields = {
    createdAt: 'created',
    updatedAt: 'updated',
    spaceKey: 'key',
};

function expectSpaceTypeIsPreserved(space: Space) {
    expect(cleanSpace(space)).toEqual(space);
    expect(splitSpace(space).spacePub.spaceType).toBe(space.spaceType);
    expect(splitSpace(space).spacePriv).not.toHaveProperty('type');
    expect(cleanSerializedSpace({ ...space, wrappedSpaceKey: 'wrapped' }).spaceType).toBe(space.spaceType);
    expect(cleanSerializedSpace({ ...space, deleted: true }).spaceType).toBe(space.spaceType);
}

describe('space field helpers', () => {
    it('keeps the simple space type when cleaning spaces', () => {
        expectSpaceTypeIsPreserved({
            id: 'simple-space',
            spaceType: SpaceType.Default,
            ...baseSpaceFields,
        });
    });

    it('keeps the project space type when cleaning spaces', () => {
        expectSpaceTypeIsPreserved({
            id: 'project-space',
            spaceType: SpaceType.Project,
            ...baseSpaceFields,
            projectName: 'Research',
            projectInstructions: 'Summarize sources',
            projectIcon: 'science',
        });
    });
});
