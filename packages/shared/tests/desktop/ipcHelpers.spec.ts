import { getAppHref } from '../../lib/apps/helper';
import { APPS } from '../../lib/constants';

vi.mock('../../lib/helpers/desktop', async (importOriginal) => {
    const actual = (await importOriginal()) as Record<string, unknown>;
    return { ...actual, isElectronMail: true, isElectronMeet: false };
});

const { handleInboxDesktopIPCPostMessages } = await import('../../lib/desktop/ipcHelpers');

const IPC_POST_MESSAGE_NAME = 'InboxDesktopIPC';
const CALENDAR_ORIGIN = new URL(getAppHref('/', APPS.PROTONCALENDAR, undefined, window.location)).origin;
const MAIL_ORIGIN = new URL(getAppHref('/', APPS.PROTONMAIL, undefined, window.location)).origin;

const appendIframe = (parentDocument: Document) => {
    const iframe = parentDocument.createElement('iframe');
    parentDocument.body.appendChild(iframe);
    return iframe.contentWindow!;
};

const USER_INFO_MESSAGE = { type: 'getUserInfo', payload: null };
const OAUTH_POPUP_V2_MESSAGE = {
    type: 'oauthPopupOpenedV2',
    payload: { action: 'oauthPopupStarted', authorizationUrl: 'https://zoom.example/oauth', sessionId: 'session-id' },
};

const dispatchRelayMessage = (
    origin: string,
    source: Window,
    message: { type: string; payload: unknown } = USER_INFO_MESSAGE
) =>
    window.dispatchEvent(
        new MessageEvent('message', {
            origin,
            source,
            data: { name: IPC_POST_MESSAGE_NAME, id: 'probe', ...message },
        })
    );

describe('handleInboxDesktopIPCPostMessages origin validation', () => {
    let send: ReturnType<typeof vi.fn>;
    let drawerFrame: Window;

    beforeAll(() => {
        handleInboxDesktopIPCPostMessages();
    });

    beforeEach(() => {
        send = vi.fn();
        window.ipcInboxMessageBroker = { send } as any;
        drawerFrame = appendIframe(document);
    });

    afterEach(() => {
        delete window.ipcInboxMessageBroker;
        document.body.innerHTML = '';
    });

    it('forwards a message from a calendar child frame to the broker', async () => {
        dispatchRelayMessage(CALENDAR_ORIGIN, drawerFrame);
        await Promise.resolve();
        expect(send).toHaveBeenCalledWith('getUserInfo', null);
    });

    it('does not forward a message from an untrusted origin', async () => {
        dispatchRelayMessage('https://untrusted.example', drawerFrame);
        await Promise.resolve();
        expect(send).not.toHaveBeenCalled();
    });

    it('does not forward a message from the mail origin', async () => {
        dispatchRelayMessage(MAIL_ORIGIN, drawerFrame);
        await Promise.resolve();
        expect(send).not.toHaveBeenCalled();
    });

    it('does not forward a calendar-origin message from a nested frame', async () => {
        const nestedFrame = appendIframe(drawerFrame.document);
        dispatchRelayMessage(CALENDAR_ORIGIN, nestedFrame);
        await Promise.resolve();
        expect(send).not.toHaveBeenCalled();
    });

    it('does not forward a calendar-origin message from the top window itself', async () => {
        dispatchRelayMessage(CALENDAR_ORIGIN, window);
        await Promise.resolve();
        expect(send).not.toHaveBeenCalled();
    });

    describe('host capability gating', () => {
        const setupHostFeatures = (supportsOAuthPopupV2: boolean) => {
            window.ipcInboxMessageBroker = {
                send,
                hasFeature: (feature: string) => feature === 'OAuthPopupV2' && supportsOAuthPopupV2,
            } as any;
        };

        it('forwards an oauth popup V2 message when the host supports it', async () => {
            setupHostFeatures(true);
            dispatchRelayMessage(CALENDAR_ORIGIN, drawerFrame, OAUTH_POPUP_V2_MESSAGE);
            await Promise.resolve();
            expect(send).toHaveBeenCalledWith(OAUTH_POPUP_V2_MESSAGE.type, OAUTH_POPUP_V2_MESSAGE.payload);
        });

        it('acknowledges but does not forward an oauth popup V2 message when the host lacks support', async () => {
            setupHostFeatures(false);
            const acknowledge = vi.spyOn(drawerFrame, 'postMessage');

            dispatchRelayMessage(CALENDAR_ORIGIN, drawerFrame, OAUTH_POPUP_V2_MESSAGE);
            await Promise.resolve();

            expect(acknowledge).toHaveBeenCalledWith(
                { name: IPC_POST_MESSAGE_NAME, id: 'probe' },
                { targetOrigin: CALENDAR_ORIGIN }
            );
            expect(send).not.toHaveBeenCalled();
        });
    });
});
