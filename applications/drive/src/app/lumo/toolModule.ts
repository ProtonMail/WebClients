import type { ToolDefinition, ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';

/** The file the user has open, when the surface has one — the preview passes it, the drawer does not. */
export interface OpenFile {
    nodeUid: string;
    name: string;
    mediaType?: string;
    size?: number;
    /** Bytes the surface already has — never fetched on the tool's behalf. */
    contents?: Uint8Array<ArrayBuffer>[];
    /**
     * Fetches thumbnail bytes of this image the model can decode, only when the tool needs to show it.
     * Resolves to undefined while no thumbnail is ready — the tool never falls back to `contents`, since
     * that would send the whole original file. See `loadPreviewThumbnail`.
     */
    loadViewableImage?: () => Promise<Uint8Array<ArrayBuffer>[] | undefined>;
}

/**
 * The Drive state a tool handler needs at call time. Handlers are built once, so the config keeps the
 * same identity across renders (see {@link buildLumoDriveConfig}) — anything that changes is read through
 * a getter, refreshed by the surface each render. The section stores are zustand singletons reached
 * through `getState()`, so only the route and the open file need wiring here.
 */
export interface DriveToolDeps {
    /** The current route, read at call time — it decides which view's contents are on screen. */
    getPathname: () => string;
    /**
     * The file open on this surface, read at call time. Supplying it is what adds the open-file tool to
     * the pack: the file preview does, the drawer (where no file is open) leaves it out.
     */
    getOpenFile?: () => OpenFile | undefined;
}

/**
 * One Drive tool, in one co-located module: its {@link ToolDefinition} (what the framework advertises)
 * and a {@link ToolHandler} factory bound to Drive's stores. {@link buildLumoDriveConfig} assembles the
 * registered modules. Mutations will add a `cardRenderer` here, as `proton-mail/lumo/toolModule.ts` does.
 */
export interface DriveToolModule {
    definition: ToolDefinition;
    createHandler: (deps: DriveToolDeps) => ToolHandler;
}
