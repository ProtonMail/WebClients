# preview-sandbox

This project encapsulates the previewer found in the Drive app, based on a [sandboxed iframe](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-sandbox).

## How it works

This project builds into a single-page HTML file. This file is loaded by the client through a blob URL, to ensure a separate origin. It communicates with `postMessage` to receive the data.

## Building

`yarn build` will build the project, and copy it to the apps that use it.

You can refer to [`bin/build.js`](./bin/build.js) to see what exactly is happening.

Make sure to copy the built file every time you change something here, until we can find a better way to handle the build.

We may also deploy to a dedicated subdomain in the future, depending on future constraints.

## `postMessage` interface

### Client to sandbox

```javascript
const message = {
    type: 'data',
    mimeType: 'application/x-mimetype',
    data: UInt8Array,
};
```

### Sandbox to client

```javascript
const message = {
    type: 'error',
    error: Error,
};
```
