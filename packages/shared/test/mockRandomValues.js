let original;

export const initRandomMock = () => {
    if (!original) {
        original = window.crypto.getRandomValues;
    }
    const staticRandom = new Uint32Array(255);
    for (let i = 0; i < 255; ++i) {
        staticRandom[i] = i;
    }

    const mockRandomValues = (buf) => {
        for (let i = 0; i < buf.length; ++i) {
            // eslint-disable-next-line
            buf[i] = staticRandom[i];
        }
        return buf;
    };

    window.crypto.getRandomValues = mockRandomValues;
};

export const disableRandomMock = () => {
    window.crypto.getRandomValues = original;
    original = undefined;
};
