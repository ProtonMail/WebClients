const scheduler = setTimeout;

export function flushPromises() {
    return new Promise(function (resolve) {
        scheduler(resolve, 0);
    });
}
