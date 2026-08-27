import type { ReferenceRegistry, ToolImage } from '@proton/llm/lib/lumoAgent/contracts/types';

import type { OpenFile } from '../../toolModule';
import {
    type OpenFileContentResult,
    createGetOpenFileContentHandler,
    getOpenFileContentDefinition,
} from './getOpenFileContent';

const openFile = (overrides: Partial<OpenFile> = {}): OpenFile => ({
    nodeUid: 'volume~node-1',
    name: 'Notes.txt',
    mediaType: 'text/plain',
    size: 100,
    ...overrides,
});

const run = (file?: OpenFile, showImage?: (image: ToolImage) => void) =>
    createGetOpenFileContentHandler({ getPathname: () => '/', getOpenFile: () => file })(
        {},
        { references: {} as ReferenceRegistry, showImage }
    );

const serialize = (result: OpenFileContentResult) =>
    getOpenFileContentDefinition.serializeForLumo(result, {} as ReferenceRegistry);

describe('read_open_file', () => {
    it('reports no file when nothing is open', async () => {
        const result = await run(undefined);

        expect(result).toEqual({ status: 'noFile' });
        expect(serialize(result)).toContain('does not have a file open');
    });

    it('refuses a media type it cannot read as text', async () => {
        const result = await run(openFile({ mediaType: 'application/pdf' }));

        expect(result).toEqual({ status: 'unsupported' });
        expect(serialize(result)).toContain('cannot be opened');
    });

    it('says so when the contents have not arrived yet', async () => {
        const result = await run(openFile({ contents: undefined }));

        expect(result).toEqual({ status: 'notLoaded' });
        expect(serialize(result)).toContain('not finished loading');
    });

    it('reads the bytes the preview already has', async () => {
        const result = await run(openFile({ contents: [new TextEncoder().encode('hello world')] }));

        expect(result).toEqual({ status: 'read', text: 'hello world', truncated: false });
        expect(serialize(result)).toBe('Here is the full content of the file:\n\n"""\nhello world\n"""');
    });

    it('truncates long text and flags it in the serialised output', async () => {
        const result = await run(openFile({ contents: [new TextEncoder().encode('a'.repeat(25_000))] }));

        if (result.status !== 'read') {
            throw new Error('expected a read result');
        }
        expect(result.text).toHaveLength(20_000);
        expect(result.truncated).toBe(true);
        expect(serialize(result)).toContain('Only the beginning of the file was read');
    });

    it('summarises the read and the refusal differently on a chip', () => {
        expect(
            getOpenFileContentDefinition.summarizeChip({}, { status: 'read', text: 'y', truncated: false }).label
        ).toBe('Read this file');
        expect(getOpenFileContentDefinition.summarizeChip({}, { status: 'unsupported' }).label).toBe(
            "Can't read this file"
        );
    });
});

describe('read_open_file, on an image', () => {
    const thumbnail = new Uint8Array([1, 2, 3]);
    const image = openFile({ mediaType: 'image/png', loadViewableImage: async () => [thumbnail] });

    it('shows the thumbnail loadViewableImage resolves, base64-encoded', async () => {
        const shown: ToolImage[] = [];

        const result = await run(image, (attached) => shown.push(attached));

        expect(result).toEqual({ status: 'shown' });
        expect(shown).toEqual([{ imageId: 'volume~node-1', name: 'Notes.txt', data: thumbnail.toBase64() }]);
        expect(serialize(result)).toContain('Look at it');
    });

    it('shows a chip saying it looked, not that it read', () => {
        expect(getOpenFileContentDefinition.summarizeChip({}, { status: 'shown' }).label).toBe('Looked at this image');
    });

    it('says the file has not loaded yet when there is no thumbnail', async () => {
        const result = await run(openFile({ mediaType: 'image/png' }));

        expect(result).toEqual({ status: 'notLoaded' });
    });

    it('refuses to show an image when the host cannot receive one', async () => {
        const result = await run(image, undefined);

        expect(result).toEqual({ status: 'unsupported' });
    });

    it('never falls back to the full file when loadViewableImage resolves undefined', async () => {
        const bytes = new Uint8Array([9, 9, 9]);
        const shown: ToolImage[] = [];

        const result = await run(
            openFile({ mediaType: 'image/png', contents: [bytes], loadViewableImage: async () => undefined }),
            (attached) => shown.push(attached)
        );

        expect(result).toEqual({ status: 'notLoaded' });
        expect(shown).toEqual([]);
    });

    it('ignores contents entirely, even when a thumbnail is also available', async () => {
        const bytes = new Uint8Array([9, 9, 9]);
        const shown: ToolImage[] = [];

        await run(
            openFile({ mediaType: 'image/png', contents: [bytes], loadViewableImage: async () => [thumbnail] }),
            (attached) => shown.push(attached)
        );

        expect(shown).toEqual([{ imageId: 'volume~node-1', name: 'Notes.txt', data: thumbnail.toBase64() }]);
    });
});

describe('read_open_file, on an image type the model cannot decode directly (e.g. HEIC)', () => {
    it('shows the thumbnail loadViewableImage resolves, even though the original type is unsupported', async () => {
        const thumbnail = new Uint8Array([1, 2, 3]);
        const shown: ToolImage[] = [];

        const result = await run(
            openFile({ mediaType: 'image/heic', contents: undefined, loadViewableImage: async () => [thumbnail] }),
            (attached) => shown.push(attached)
        );

        expect(result).toEqual({ status: 'shown' });
        expect(shown).toEqual([{ imageId: 'volume~node-1', name: 'Notes.txt', data: thumbnail.toBase64() }]);
    });

    it('never falls back to raw contents, since those bytes are not something the model can decode', async () => {
        const rawHeicBytes = new Uint8Array([9, 9, 9]);
        const shown: ToolImage[] = [];

        const result = await run(
            openFile({ mediaType: 'image/heic', contents: [rawHeicBytes], loadViewableImage: async () => undefined }),
            (attached) => shown.push(attached)
        );

        expect(result).toEqual({ status: 'notLoaded' });
        expect(shown).toEqual([]);
    });

    it('reports not loaded while the thumbnail has not arrived yet', async () => {
        const result = await run(openFile({ mediaType: 'image/heic', contents: undefined }));

        expect(result).toEqual({ status: 'notLoaded' });
    });
});
