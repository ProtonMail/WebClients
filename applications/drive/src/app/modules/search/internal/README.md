# Search Module

Client-side search for Drive, powered by a SharedWorker so indexing runs once and is shared across all open tabs. Built on top of the [Foundation Search library](https://protonag.atlassian.net/wiki/spaces/FOUN/pages/798785579/Foundation+Search+-+Pitch).

## Architecture

The search module is a singleton that runs on the main JS thread and internally spawns a SharedWorker. The main thread and the worker communicate via Comlink (async RPC over MessagePort).

## Engine Orchestrator

The orchestrator manages a set of engines, each identified by an `EngineType` (e.g. `MY_FILES`). Each engine config defines how to build and query a particular index. Once the bulk indexing for a given engine config completes, that config is considered active — the engine can then start answering search queries.

In the future, we may want to change the indexing logic for a given engine type. To do this, we can provide a new engine config. While the new config's index is being built, search queries continue to be answered by the currently active config. When the new config finishes bulk indexing, it is promoted to become the active config for that engine type, replacing the previous one.

## Progressive search results

Search results are streamed progressively using async generators.

## Main thread / worker boundary

Indexing and cross-tab coordination live in the worker. Some APIs (e.g. Drive SDK, and potentially encryption in the future) can only run on the main thread. These are exposed to the worker through a proxy bridge, so the worker can trigger their execution without importing them directly.

## Multi-tab coordination

Each tab registers as a client and sends keep-alive heartbeats. The worker detects stale clients and elects a single active client, ensuring indexing runs only once across all open tabs — even if a tab crashes without clean disconnection.

## Integration with React

The module is connected to the React world through a useSearchModule hook that lives outside of the module.

## Logging

A unified logger works in both the main thread and the worker. See Logger.ts for details.
