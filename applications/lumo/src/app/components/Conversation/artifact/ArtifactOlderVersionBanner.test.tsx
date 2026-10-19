import { fireEvent, render, screen } from '@testing-library/react';

import { ArtifactOlderVersionBanner } from './ArtifactOlderVersionBanner';
import type { ArtifactVersion } from './artifactRegistry';

const versions: ArtifactVersion[] = [
    {
        messageId: 'a',
        content: 'v1',
        createdAt: '2026-01-01T09:00:00Z',
        source: 'prompt',
        promptExcerpt: 'Write an email',
    },
    { messageId: 'b', content: 'v2', createdAt: '2026-01-01T09:05:00Z', source: 'manual-edit' },
    {
        messageId: 'c',
        content: 'v3',
        createdAt: '2026-01-01T09:10:00Z',
        source: 'prompt',
        promptExcerpt: 'Make it formal',
    },
];

describe('ArtifactOlderVersionBanner', () => {
    it('says which version is shown and returns to the latest', () => {
        const onViewLatest = jest.fn();
        render(
            <ArtifactOlderVersionBanner
                version={versions[0]}
                versionNumber={1}
                versionCount={3}
                onViewLatest={onViewLatest}
            />
        );

        expect(screen.getByText(/You're viewing version 1 of 3/)).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'View latest' }));
        expect(onViewLatest).toHaveBeenCalledTimes(1);
    });
});
