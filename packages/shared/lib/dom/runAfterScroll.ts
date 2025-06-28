export const runAfterScroll = (el: Element, done: () => void) => {
    let same = 0;
    let lastPos = el.scrollTop;
    let startTime = -1;
    // Timeout after 1 second
    const maxTime = 1000;
    const maxFrames = 4;

    const cb = (time: number) => {
        if (startTime === -1) {
            startTime = time;
        }
        if (time - startTime > maxTime) {
            done();
            return;
        }
        const newPos = el.scrollTop;
        if (lastPos === newPos) {
            if (same++ > maxFrames) {
                done();
                return;
            }
        } else {
            same = 0;
            lastPos = newPos;
        }

        requestAnimationFrame(cb);
    };

    requestAnimationFrame(cb);
};
