import service from '../../../../src/app/message/services/transformEmbedded';

describe('transformEmbedded service', () => {
    const EMBEDDED_NAME = 'embedded name';
    const EMBEDDED_URL = 'embedded url';
    const INLINE_EMBEDDED_URL = 'data:image/png;base64,iVBORw0KGgoA';
    const MailSettings = {
        ShowImages: 0
    };
    const embeddedService = {
        getAttachment(msg, src) {
            if (src === 'cid:embedded.jpg') {
                return {
                    Name: EMBEDDED_NAME
                };
            }
        },
        getUrl(node) {
            const src = node.getAttribute('data-embedded-img') || '';
            if (src.startsWith('data:')) {
                return src;
            }
            return EMBEDDED_URL;
        }
    };
    const $stateService = {
        is() {
            return false;
        }
    };
    const mailSettingsModel = {
        get(key = 'all') {
            return key === 'all' ? MailSettings : MailSettings[key];
        }
    };

    const factory = service(embeddedService, $stateService, mailSettingsModel);

    const DOM = `
        <img proton-src="cid:embedded.jpg">
        <img proton-src="/remote.jpg">
        <img proton-src="${INLINE_EMBEDDED_URL}">
    `;

    const dom = (html) => {
        const div = document.createElement('DIV');
        div.innerHTML = html;
        return div;
    };

    const shouldLoad = (name, { message, mailSettings, options }) => {
        let output;

        describe(name, () => {
            beforeEach(() => {
                Object.assign(MailSettings, mailSettings);
                output = factory(dom(DOM), message, options);
            });

            it('should add src for embedded img', () => {
                const img = output.querySelectorAll('img');
                const embeddedImg = img[0];
                expect(embeddedImg.getAttribute('class')).toEqual('proton-embedded');
                expect(embeddedImg.getAttribute('src')).toEqual(EMBEDDED_URL);
                expect(embeddedImg.getAttribute('referrerpolicy')).toEqual('no-referrer');
            });

            it('should not add src for remote img', () => {
                const img = output.querySelectorAll('img');
                const remoteImg = img[1];
                expect(remoteImg.getAttribute('src')).toBeNull();
            });

            it('should add src for inline embedded img', () => {
                const img = output.querySelectorAll('img');
                const embeddedImg = img[2];
                expect(embeddedImg.getAttribute('class')).toEqual('proton-embedded');
                expect(embeddedImg.getAttribute('src')).toEqual(INLINE_EMBEDDED_URL);
                expect(embeddedImg.getAttribute('referrerpolicy')).toEqual('no-referrer');
            });
        });
    };

    shouldLoad('should load embedded images when showEmbedded = true', {
        message: { showEmbedded: true },
        mailSettings: { ShowImages: 0 },
        options: { action: 'reply' }
    });

    shouldLoad('should load embedded images when showEmbedded = false and mailSettings = true', {
        message: { showEmbedded: false },
        mailSettings: { ShowImages: 2 },
        options: { action: 'reply' }
    });

    shouldLoad('should load embedded images when showEmbedded = false and mailSettings = true', {
        message: { showEmbedded: false },
        mailSettings: { ShowImages: 2 },
        options: { action: 'forward' }
    });

    shouldLoad('should load embedded images when showEmbedded = false and mailSettings = true', {
        message: { showEmbedded: true },
        mailSettings: { ShowImages: 0 },
        options: { action: 'forward' }
    });

    const shouldNotLoad = (name, { message, mailSettings, options }) => {
        let output;

        describe(name, () => {
            beforeEach(() => {
                Object.assign(MailSettings, mailSettings);
                output = factory(dom(DOM), message, options);
            });

            it('should not add src for embedded img', () => {
                const img = output.querySelectorAll('img');
                const embeddedImg = img[0];
                expect(embeddedImg.getAttribute('class')).toEqual('proton-embedded');
                expect(embeddedImg.getAttribute('src')).toBeNull();
                if (options.action !== 'new') {
                    expect(embeddedImg.getAttribute('alt')).toEqual(EMBEDDED_NAME);
                }
                expect(embeddedImg.getAttribute('referrerpolicy')).toEqual('no-referrer');
            });

            it('should not add src for remote img', () => {
                const img = output.querySelectorAll('img');
                const remoteImg = img[1];
                expect(remoteImg.getAttribute('src')).toBeNull();
            });

            it('should not add src for inline embedded img', () => {
                const img = output.querySelectorAll('img');
                const embeddedImg = img[2];
                expect(embeddedImg.getAttribute('class')).toEqual('proton-embedded');
                expect(embeddedImg.getAttribute('src')).toBeNull();
                expect(embeddedImg.getAttribute('alt')).toBeNull();
                expect(embeddedImg.getAttribute('referrerpolicy')).toEqual('no-referrer');
            });
        });
    };

    shouldNotLoad('should not load embedded images when showEmbedded = false and showImages = false', {
        message: { showEmbedded: false },
        mailSettings: { ShowImages: 0 },
        options: { action: 'reply' }
    });

    shouldNotLoad('should not load embedded images when showEmbedded = false and showImages = false and action is not reply or forward', {
        message: { showEmbedded: true },
        mailSettings: { ShowImages: 2 },
        options: { action: 'new' }
    });
});
