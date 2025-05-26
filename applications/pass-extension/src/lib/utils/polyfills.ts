if (BUILD_TARGET === 'safari') {
    globalThis.requestIdleCallback =
        globalThis.requestIdleCallback ||
        function (cb) {
            const start = Date.now();
            return setTimeout(
                () =>
                    cb({
                        didTimeout: false,
                        timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
                    }),
                1
            );
        };

    globalThis.cancelIdleCallback =
        globalThis.cancelIdleCallback ||
        function (id) {
            clearTimeout(id);
        };
}
