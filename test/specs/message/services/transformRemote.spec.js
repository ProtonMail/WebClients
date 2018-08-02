import service from '../../../../src/app/message/services/transformRemote';

describe('transformRemote service', () => {
    const REMOTE_URL = '/remote.jpg';
    const INLINE_EMBEDDED_URL = 'data:image/png;base64,iVBORw0KGgoA';
    const MailSettings = {
        ShowImages: 0
    };
    const $state = {
        is() {
        }
    };
    const $rootScope = {
        $emit() {
        }
    };
    const mailSettingsModel = {
        get(key = 'all') {
            return key === 'all' ? MailSettings : MailSettings[key];
        }
    };

    const factory = service($state, $rootScope, mailSettingsModel);

    const DOM = `
        <img proton-src="${REMOTE_URL}">
        <img proton-src="${INLINE_EMBEDDED_URL}">
        <img proton-src="cid:embedded.jpg">
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

            it('should add src for remote img', () => {
                const imgs = output.querySelectorAll('img');
                const img = imgs[0];
                expect(img.getAttribute('src')).toEqual(REMOTE_URL);
            });

            it('should not add src for inline embedded img', () => {
                const imgs = output.querySelectorAll('img');
                const img = imgs[1];
                expect(img.getAttribute('src')).toBeNull();
            });

            it('should not add src for embedded img', () => {
                const imgs = output.querySelectorAll('img');
                const img = imgs[2];
                expect(img.getAttribute('src')).toBeNull();
            });
        });
    };

    shouldLoad('should load remote images when showImages = true', {
        message: { showImages: true, Sender: {} },
        mailSettings: { ShowImages: 0 },
        options: { action: '' }
    });
    shouldLoad('should load remote images when showImages = false and ShowImages = 1', {
        message: { showImages: false, Sender: {} },
        mailSettings: { ShowImages: 1 },
        options: { action: '' }
    });

    const shouldNotLoad = (name, { message, mailSettings, options }) => {
        let output;

        describe(name, () => {
            beforeEach(() => {
                Object.assign(MailSettings, mailSettings);
                output = factory(dom(DOM), message, options);
            });

            it('should not add src for remote img', () => {
                const imgs = output.querySelectorAll('img');
                const img = imgs[0];
                expect(img.getAttribute('src')).toBeNull();
            });

            it('should not add src for inline embedded image', () => {
                const imgs = output.querySelectorAll('img');
                const img = imgs[1];
                expect(img.getAttribute('src')).toBeNull();
            });

            it('should not add src for embedded image', () => {
                const imgs = output.querySelectorAll('img');
                const img2 = imgs[2];
                expect(img2.getAttribute('src')).toBeNull();
            });
        });
    };

    shouldNotLoad('should load remote images when showImages = false and ShowImages = 0', {
        message: { showImages: false, Sender: {} },
        mailSettings: { ShowImages: 0 },
        options: { action: '' }
    });
});
