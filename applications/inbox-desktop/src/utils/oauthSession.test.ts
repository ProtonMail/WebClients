import { GOOGLE_OAUTH_PATH } from "@proton/shared/lib/api/activation";

import { clearOAuthSession, matchesActiveOAuthSession, startOAuthSession } from "./oauthSession";

jest.mock("./log", () => ({ ipcLogger: { warn: jest.fn() } }));

const SESSION_ID = "session";
const AUTHORIZATION_URL = `https://account.proton.me${GOOGLE_OAUTH_PATH}`;

describe("matchesActiveOAuthSession", () => {
    afterEach(() => {
        clearOAuthSession(SESSION_ID);
    });

    it("returns false when no session is active", () => {
        expect(matchesActiveOAuthSession(AUTHORIZATION_URL)).toBe(false);
    });

    it("matches the authorization URL and sub-paths of an active session", () => {
        startOAuthSession(SESSION_ID, AUTHORIZATION_URL);

        expect(
            matchesActiveOAuthSession(
                `${AUTHORIZATION_URL}?redirect_uri=https%3A%2F%2Faccount.proton.me%2Foauth%2Fcallback`,
            ),
        ).toBe(true);
        expect(matchesActiveOAuthSession(`${AUTHORIZATION_URL}/consent`)).toBe(true);
    });

    it("returns false for other paths or origins", () => {
        startOAuthSession(SESSION_ID, AUTHORIZATION_URL);

        expect(matchesActiveOAuthSession("https://account.proton.me/settings")).toBe(false);
        expect(matchesActiveOAuthSession(`https://example.me${GOOGLE_OAUTH_PATH}`)).toBe(false);
    });

    it("returns false once the session is cleared", () => {
        startOAuthSession(SESSION_ID, AUTHORIZATION_URL);
        clearOAuthSession(SESSION_ID);

        expect(matchesActiveOAuthSession(AUTHORIZATION_URL)).toBe(false);
    });

    it("returns false for a malformed URL", () => {
        startOAuthSession(SESSION_ID, AUTHORIZATION_URL);

        expect(matchesActiveOAuthSession("invalid url")).toBe(false);
    });
});

describe("OAuth session timeout", () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        clearOAuthSession(SESSION_ID);
        jest.useRealTimers();
    });

    it("clears the session after 10 seconds", () => {
        startOAuthSession(SESSION_ID, AUTHORIZATION_URL);

        jest.advanceTimersByTime(9_999);
        expect(matchesActiveOAuthSession(AUTHORIZATION_URL)).toBe(true);

        jest.advanceTimersByTime(1);
        expect(matchesActiveOAuthSession(AUTHORIZATION_URL)).toBe(false);
    });

    it("restarts the timeout when the same session starts again", () => {
        startOAuthSession(SESSION_ID, AUTHORIZATION_URL);
        jest.advanceTimersByTime(9_000);
        startOAuthSession(SESSION_ID, AUTHORIZATION_URL);

        jest.advanceTimersByTime(9_000);
        expect(matchesActiveOAuthSession(AUTHORIZATION_URL)).toBe(true);
    });
});
