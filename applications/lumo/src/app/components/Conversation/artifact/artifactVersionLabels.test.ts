import type { ArtifactVersion } from './artifactRegistry';
import { formatArtifactVersionTime, getArtifactVersionDescription } from './artifactVersionLabels';

const version = (overrides: Partial<ArtifactVersion>): ArtifactVersion => {
    return { messageId: 'm', content: '', createdAt: '2026-01-01T00:00:00Z', source: 'prompt', ...overrides };
};

describe('artifactVersionLabels', () => {
    it('describes a version by the request behind it, falling back by source', () => {
        expect(getArtifactVersionDescription(version({ promptExcerpt: 'Make it formal' }), 1)).toBe('Make it formal');
        expect(getArtifactVersionDescription(version({}), 0)).toBe('Created');
        expect(getArtifactVersionDescription(version({}), 2)).toBe('Revised');
        expect(getArtifactVersionDescription(version({ source: 'inline-edit' }), 2)).toBe('Changed a selection');
        expect(getArtifactVersionDescription(version({ source: 'manual-edit' }), 2)).toBe('Edited by hand');
    });

    it('labels today and yesterday, and returns nothing for an invalid date', () => {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        expect(formatArtifactVersionTime(now.toISOString())).toMatch(/^Today at /);
        expect(formatArtifactVersionTime(yesterday.toISOString())).toMatch(/^Yesterday at /);
        expect(formatArtifactVersionTime('not a date')).toBe('');
    });
});
