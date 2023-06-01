const scheduler = typeof setImmediate === 'function' ? setImmediate : setTimeout;

export function flushPromises() {
    return new Promise(function (resolve) {
        scheduler(resolve);
    });
}
