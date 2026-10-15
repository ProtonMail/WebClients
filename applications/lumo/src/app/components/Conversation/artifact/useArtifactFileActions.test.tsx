import type { ReactNode } from 'react';

import { renderHook } from '@testing-library/react';

import { IsGuestProvider } from '../../../providers/IsGuestProvider';
import { downloadBlob } from '../../../util/pdf/downloadBlob';
import type { ParsedArtifact } from './parseArtifacts';
import { useArtifactFileActions } from './useArtifactFileActions';

jest.mock('@proton/app-context/useNotifications', () => {
    return { useNotifications: () => ({ createNotification: jest.fn() }) };
});
jest.mock('../../../util/pdf/downloadBlob', () => {
    return { downloadBlob: jest.fn() };
});
jest.mock('../../../util/telemetry', () => {
    return { ...jest.requireActual('../../../util/telemetry'), sendArtifactDownloadedEvent: jest.fn() };
});
// The exporters pull in ESM-only markdown and chart libraries Jest can't load; they aren't run here.
// Support rules mirror artifactHtmlDocument.
jest.mock('./artifactFileBytes', () => {
    return { buildArtifactFileForSave: jest.fn() };
});
jest.mock('./artifactSourceDownload', () => {
    return { buildArtifactSourceDownloadFile: jest.fn() };
});
jest.mock('./artifactPdfExport', () => {
    return {
        exportArtifactPdf: jest.fn(),
        artifactSupportsPdfExport: (type: string) => {
            return type === 'document' || type === 'presentation';
        },
    };
});
jest.mock('./artifactPptxExport', () => {
    return {
        downloadArtifactPptx: jest.fn(),
        artifactSupportsPptxExport: (type: string) => {
            return type === 'presentation';
        },
    };
});
jest.mock('./SaveArtifactToDriveModal', () => {
    return { __esModule: true, default: () => null };
});

const document: ParsedArtifact = { id: 'memo', type: 'document', title: 'Memo', content: '# Memo' };
const deck: ParsedArtifact = { id: 'deck', type: 'presentation', title: 'Deck', content: '<html>built deck</html>' };

const renderFileActions = (options: Parameters<typeof useArtifactFileActions>[0], isGuest = false) => {
    const wrapper = ({ children }: { children: ReactNode }) => {
        return <IsGuestProvider isGuest={isGuest}>{children}</IsGuestProvider>;
    };
    return renderHook(
        () => {
            return useArtifactFileActions(options);
        },
        { wrapper }
    ).result.current;
};

const keys = (options: { key: string }[]) => {
    return options.map((option) => {
        return option.key;
    });
};

describe('useArtifactFileActions', () => {
    it('offers the source and the exports a document supports, and Drive formats', () => {
        const actions = renderFileActions({ artifact: document, layout: 'docked', viewedOlderVersion: false });
        expect(keys(actions.downloadOptions)).toEqual(['source', 'pdf', 'docx']);
        expect(keys(actions.saveToDriveOptions)).toEqual(['docx', 'pdf', 'md', 'txt']);
    });

    it('keeps the source and Drive while exports are disabled', () => {
        const actions = renderFileActions({
            artifact: document,
            layout: 'docked',
            viewedOlderVersion: false,
            exportsDisabled: true,
        });
        expect(keys(actions.downloadOptions)).toEqual(['source']);
        expect(keys(actions.saveToDriveOptions)).toEqual(['docx', 'pdf', 'md', 'txt']);
    });

    it('offers only the stored file when sourceOnly, and downloads it as is', () => {
        const sourceFile = { data: deck.content, fileName: 'Deck.html', mimeType: 'text/html;charset=utf-8' };
        const actions = renderFileActions({
            artifact: deck,
            layout: 'library',
            viewedOlderVersion: false,
            sourceOnly: true,
            sourceFile,
        });
        expect(keys(actions.downloadOptions)).toEqual(['source']);
        expect(actions.downloadOptions[0].extension).toBe('.html');
        expect(actions.saveToDriveOptions).toEqual([]);

        actions.downloadOptions[0].onSelect();
        expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'Deck.html');
    });

    // D18: a JSON deck's source is the deck itself; it has a native PPTX but no PDF yet.
    it('offers a JSON deck its data, PowerPoint, and PowerPoint on Drive, but no PDF', () => {
        const jsonDeck: ParsedArtifact = {
            id: 'deck',
            type: 'presentation',
            title: 'Deck',
            content: JSON.stringify({ slides: [{ layout: 'title', title: 'Deck' }] }),
        };
        const actions = renderFileActions({ artifact: jsonDeck, layout: 'docked', viewedOlderVersion: false });
        expect(keys(actions.downloadOptions)).toEqual(['source', 'pptx']);
        expect(actions.downloadOptions[0].extension).toBe('.json');
        expect(actions.downloadOptions[0].label).toBe('Slide data');
        expect(keys(actions.saveToDriveOptions)).toEqual(['pptx']);
    });

    it('hides Save to Drive from guests', () => {
        const actions = renderFileActions({ artifact: document, layout: 'docked', viewedOlderVersion: false }, true);
        expect(actions.saveToDriveOptions).toEqual([]);
    });

    it('offers nothing until there is an artifact', () => {
        const actions = renderFileActions({ artifact: undefined, layout: 'library', viewedOlderVersion: false });
        expect(actions.downloadOptions).toEqual([]);
        expect(actions.saveToDriveOptions).toEqual([]);
    });
});
