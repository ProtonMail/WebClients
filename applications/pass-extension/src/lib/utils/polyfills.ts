if (BUILD_TARGET === 'safari') {
    globalThis.requestIdleCallback = (fn) => setTimeout(fn, 0);
    globalThis.cancelIdleCallback = clearTimeout;
}
