import { c } from 'ttag';

import type { ToolDefinition, ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';
import { isSupportedText } from '@proton/shared/lib/helpers/mimetype';
import mergeUint8Arrays from '@proton/utils/mergeUint8Arrays';

import type { DriveToolDeps, DriveToolModule } from '../../toolModule';

/**
 * The file the user has open, on demand: nothing of its contents leaves the device until the model asks
 * for it. Text comes back in the tool result; an image goes through `showImage` as base64, since a tool
 * result carries text alone.
 */

// TODO: PDF and office files — Lumo supports them, we cannot extract their text yet (needs
// pdfjs-dist client-side, as applications/lumo does).

/** Text types we can hand over: text/*, JSON, JS/TS, shell scripts and XHTML, as the preview reads them. */
export const canReadText = (mediaType?: string) => !!mediaType && isSupportedText(mediaType);

/**
 * Image types Lumo can look at. Never the original file — only ever a thumbnail, always in a directly
 * viewable format, which also covers types the model could never decode itself (HEIC, RAW, ...).
 */
export const canSeeImage = (mediaType?: string) => !!mediaType && mediaType.startsWith('image/');

const MAX_CHARS = 20_000;

export type OpenFileContentResult =
    | { status: 'noFile' }
    | { status: 'unsupported' }
    | { status: 'notLoaded' }
    | { status: 'shown' }
    | { status: 'read'; text: string; truncated: boolean };

export const getOpenFileContentDefinition: ToolDefinition<Record<string, never>, OpenFileContentResult> = {
    name: 'read_open_file',
    kind: 'read',
    toolDescription:
        "Opens the file the user currently has open, and nothing else in Drive: it returns the file's text, or, when the file is an image, puts that image in front of you to look at. Call it before saying anything about what is inside that file — summarising it, describing it, quoting it, translating it, or answering a question about it. Call it ONLY when the user asks about that file: a greeting or an unrelated question needs no tool call. Do NOT call it for the file's name, type or size, which are already given to you. It cannot open PDFs or office documents.",
    paramsSchema: { type: 'object', additionalProperties: false, required: [], properties: {} },
    serializeForLumo: (result) => {
        switch (result.status) {
            case 'noFile':
                return 'The user does not have a file open right now, so there is nothing to read.';
            case 'unsupported':
                return 'This file cannot be opened. Tell the user plainly that you cannot read this file, and never guess at its contents.';
            case 'notLoaded':
                return 'This file has not finished loading yet. Tell the user to try again in a moment, and never guess at its contents.';
            case 'shown':
                return "The image is now attached to the user's message. Look at it and answer from what you actually see — nothing else about it is available.";
            case 'read':
                return result.truncated
                    ? `Only the beginning of the file was read, because it is long. Never claim to have seen the rest of it. What was read:\n\n"""\n${result.text}\n"""`
                    : `Here is the full content of the file:\n\n"""\n${result.text}\n"""`;
        }
    },
    summarizeChip: (_params, result) => {
        if (result.status === 'read') {
            return { label: c('Info').t`Read this file` };
        }
        return result.status === 'shown'
            ? { label: c('Info').t`Looked at this image` }
            : { label: c('Info').t`Can't read this file` };
    },
};

export const createGetOpenFileContentHandler =
    (deps: DriveToolDeps): ToolHandler<Record<string, never>, OpenFileContentResult> =>
    async (_params, { showImage }) => {
        const file = deps.getOpenFile?.();
        if (!file) {
            return { status: 'noFile' };
        }

        if (canSeeImage(file.mediaType)) {
            // Never fall back to `file.contents`: that's the original file, and sending the whole
            // picture to Lumo defeats the point of only sharing a thumbnail.
            // TODO: when this resolves undefined because Drive has no thumbnail yet, trigger thumbnail
            // generation here instead of just reporting notLoaded.
            const contents = await file.loadViewableImage?.();
            if (!contents) {
                return { status: 'notLoaded' };
            }
            if (!showImage) {
                return { status: 'unsupported' };
            }
            showImage({ imageId: file.nodeUid, name: file.name, data: mergeUint8Arrays(contents).toBase64() });
            return { status: 'shown' };
        }

        if (!canReadText(file.mediaType)) {
            return { status: 'unsupported' };
        }
        if (!file.contents) {
            return { status: 'notLoaded' };
        }

        const text = new TextDecoder().decode(mergeUint8Arrays(file.contents));
        const truncated = text.length > MAX_CHARS;
        return { status: 'read', text: truncated ? text.slice(0, MAX_CHARS) : text, truncated };
    };

export const getOpenFileContentModule: DriveToolModule = {
    definition: getOpenFileContentDefinition,
    createHandler: createGetOpenFileContentHandler,
};
