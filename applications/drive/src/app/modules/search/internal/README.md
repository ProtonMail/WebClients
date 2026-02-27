# Search Module

Client-side search for Drive, powered by a SharedWorker so indexing runs once and is shared across all open tabs. Built on top of the [Foundation Search library](https://protonag.atlassian.net/wiki/spaces/FOUN/pages/798785579/Foundation+Search+-+Pitch).

## Architecture

The search module is a singleton that runs on the main JS thread and internally spawns a SharedWorker. The main thread and the worker communicate via Comlink (async RPC over MessagePort).

The module checks its activation state before starting: feature flag, browser capabilities (SharedWorker, IndexedDB), Safari <17 excluded, mobile devices excluded.

## Main thread / worker boundary

Indexing and cross-tab coordination live in the worker. Some APIs (e.g. Drive SDK, and potentially encryption in the future) can only run on the main thread. These are exposed to the worker through a proxy bridge, so the worker can trigger their execution without importing them directly.

## Multi-tab coordination

Each tab registers as a client and sends keep-alive heartbeats. The worker detects stale clients and elects a single active client, ensuring indexing runs only once across all open tabs — even if a tab crashes without clean disconnection.

## Integration with React

The module is connected to the React world through a hook that lives outside of the module. The hook creates the singleton instance and injects all required external dependencies (Drive SDK, etc.).

## Logging

A unified logger works in both the main thread and the worker. Since the worker console is not directly accessible in the browser, worker logs are forwarded to the main thread via a dedicated BroadcastChannel (separate from the Comlink RPC), so all logs appear in one consolidated place in the debugger.

Enable with `localStorage.setItem('proton-drive-debug', 'true')`.

In the future, the logger will support a persistence layer to allow storing logs and letting users export them for debugging.
