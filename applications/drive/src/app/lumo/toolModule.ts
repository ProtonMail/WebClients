import type { ToolDefinition, ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';

/**
 * The Drive state a tool handler needs at call time. Handlers are built once (so the agent config stays
 * referentially stable — see {@link buildLumoDriveConfig}), so anything that can change between renders
 * is read through a getter rather than captured: the provider refreshes the backing value each render
 * and the handler always sees the current snapshot. The section stores are zustand singletons a handler
 * reaches through `getState()`, so they need no wiring here — only the route does.
 */
export interface DriveToolDeps {
    /** The current route, read at call time — it decides which view's contents are on screen. */
    getPathname: () => string;
}

/**
 * One Drive tool, authored as a single co-located module (the "class per tool"): its
 * {@link ToolDefinition} (what the framework advertises) and a {@link ToolHandler} factory bound to
 * Drive's stores. {@link buildLumoDriveConfig} assembles the registered modules into the framework's
 * config. Mutations will add a `cardRenderer` here, as `proton-mail/lumo/toolModule.ts` already does.
 */
export interface DriveToolModule {
    definition: ToolDefinition;
    createHandler: (deps: DriveToolDeps) => ToolHandler;
}
