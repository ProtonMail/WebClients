import { fireEvent, render, screen } from '@testing-library/react';

import { ArtifactTitleMenu } from './ArtifactTitleMenu';
import type { ArtifactMenuFormatOption } from './ArtifactTitleMenu';
import type { ArtifactVersion } from './artifactRegistry';

jest.mock('../../../hooks/useIsLumoSmallScreen', () => {
    return { useIsLumoSmallScreen: () => ({ isSmallScreen: false }) };
});
jest.mock('../../../hooks/useIsTouchDevice', () => {
    return { useIsTouchDevice: () => false };
});

const versions: ArtifactVersion[] = [
    {
        messageId: 'a',
        content: 'v1',
        title: 'Comparison Report',
        createdAt: '2026-01-01T09:00:00Z',
        source: 'prompt',
        promptExcerpt: 'Compare password managers',
    },
    {
        messageId: 'b',
        content: 'v2',
        title: 'Password Manager Memo',
        createdAt: '2026-01-01T09:10:00Z',
        source: 'manual-edit',
    },
];

const formatOption = (key: string, label: string, onSelect = jest.fn()): ArtifactMenuFormatOption => {
    return { key, label, extension: `.${key}`, icon: 'FileText', onSelect };
};

interface RenderOptions {
    downloadOptions?: ArtifactMenuFormatOption[];
    saveToDriveOptions?: ArtifactMenuFormatOption[];
    onEdit?: () => void;
}

const renderMenu = ({ downloadOptions = [], saveToDriveOptions = [], onEdit }: RenderOptions = {}) => {
    const props = {
        onOpen: jest.fn(),
        onSelectVersion: jest.fn(),
        onCopy: jest.fn(),
    };
    render(
        <ArtifactTitleMenu
            title="Password Manager Memo"
            versions={versions}
            selectedIndex={1}
            copyShortcutLabel="⌘C"
            downloadOptions={downloadOptions}
            saveToDriveOptions={saveToDriveOptions}
            onEdit={onEdit}
            {...props}
        />
    );
    fireEvent.click(screen.getByRole('button', { name: /Password Manager Memo/ }));
    return props;
};

describe('ArtifactTitleMenu', () => {
    it('lists versions newest first with their own titles and who made them', () => {
        const { onOpen, onSelectVersion } = renderMenu();

        expect(onOpen).toHaveBeenCalledTimes(1);
        const rows = screen.getAllByText(/^v\d · /).map((node) => {
            return node.textContent;
        });
        expect(rows).toEqual(['v2 · Password Manager Memo (latest)', 'v1 · Comparison Report']);
        expect(screen.getByText(/^You · /)).toBeInTheDocument();
        expect(screen.getByText(/^Lumo · /)).toBeInTheDocument();

        fireEvent.click(screen.getByText('v1 · Comparison Report'));
        expect(onSelectVersion).toHaveBeenCalledWith(0);
    });

    it('copies, and only offers Edit when it is allowed', () => {
        const { onCopy } = renderMenu();

        expect(screen.queryByText('Edit')).not.toBeInTheDocument();
        fireEvent.click(screen.getByText('Copy'));
        expect(onCopy).toHaveBeenCalledTimes(1);
    });

    it('downloads directly when the type has a single format', () => {
        const onSelect = jest.fn();
        renderMenu({ downloadOptions: [formatOption('py', 'Source file', onSelect)] });

        expect(screen.getByText('.py')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Download'));
        expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it('opens a submenu of formats when there are several', () => {
        const onPdf = jest.fn();
        renderMenu({ downloadOptions: [formatOption('md', 'Markdown'), formatOption('pdf', 'PDF', onPdf)] });

        expect(screen.queryByText('Download as')).not.toBeInTheDocument();
        fireEvent.click(screen.getByText('Download'));
        expect(screen.getByText('Download as')).toBeInTheDocument();

        fireEvent.click(screen.getByText('PDF'));
        expect(onPdf).toHaveBeenCalledTimes(1);
    });

    it('hides Save to Proton Drive when there are no formats to save', () => {
        renderMenu();
        expect(screen.queryByText('Save to Proton Drive')).not.toBeInTheDocument();
    });
});
