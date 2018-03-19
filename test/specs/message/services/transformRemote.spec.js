import service from '../../../../src/app/message/services/transformRemote';

describe('transformRemote service', () => {
    const REMOTE_URL = '/remote.jpg';
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
                const img = output.querySelectorAll('img');
                const remoteImg = img[0];
                expect(remoteImg.getAttribute('src')).toEqual(REMOTE_URL);
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
                const img = output.querySelectorAll('img');
                const remoteImg = img[0];
                expect(remoteImg.getAttribute('src')).toBeNull();
            });
        });
    };

    shouldNotLoad('should load remote images when showImages = false and ShowImages = 0', {
        message: { showImages: false, Sender: {} },
        mailSettings: { ShowImages: 0 },
        options: { action: '' }
    });
});
