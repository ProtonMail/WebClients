import { fireEvent, render, screen } from '@testing-library/react';

import { ArtifactOlderVersionBanner, ArtifactVersionHistoryDropdown } from './ArtifactVersionHistoryDropdown';
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

describe('ArtifactVersionHistoryDropdown', () => {
    it('lists versions newest first and selects the one clicked', () => {
        const onOpen = jest.fn();
        const onSelectVersion = jest.fn();
        render(
            <ArtifactVersionHistoryDropdown
                versions={versions}
                selectedIndex={2}
                onOpen={onOpen}
                onSelectVersion={onSelectVersion}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /Version history, showing v3 · Latest/ }));
        expect(onOpen).toHaveBeenCalledTimes(1);

        const descriptions = screen.getAllByText(/Make it formal|Edited by hand|Write an email/).map((node) => {
            return node.textContent;
        });
        expect(descriptions).toEqual(['Make it formal', 'Edited by hand', 'Write an email']);

        fireEvent.click(screen.getByText('Write an email'));
        expect(onSelectVersion).toHaveBeenCalledWith(0);
    });

    it('labels an older version in the trigger', () => {
        render(
            <ArtifactVersionHistoryDropdown
                versions={versions}
                selectedIndex={0}
                onOpen={jest.fn()}
                onSelectVersion={jest.fn()}
            />
        );

        expect(screen.getByRole('button', { name: /showing v1 of 3/ })).toBeInTheDocument();
    });
});

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
