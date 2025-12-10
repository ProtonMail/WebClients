import { isValidFlagString } from "./isValidFlagString";

describe("isValidFlagString", () => {
    it("should return true for safe JSON strings", () => {
        const safeStrings = [
            '{"name": "test", "enabled": true}',
            '[{"name": "flag1", "enabled": true}]',
            '{"normalProperty": "value"}',
            '{"MeetDesktopDevToolsEnabled": true}',
        ];

        safeStrings.forEach((str) => {
            expect(isValidFlagString(str)).toBe(true);
        });
    });

    it("should return false for strings containing __proto__", () => {
        expect(isValidFlagString('{"__proto__": {"polluted": true}}')).toBe(false);
        expect(isValidFlagString('{"__PROTO__": {"polluted": true}}')).toBe(false);
    });

    it("should return false for strings containing constructor", () => {
        expect(isValidFlagString('{"constructor": {"polluted": true}}')).toBe(false);
        expect(isValidFlagString('{"CONSTRUCTOR": {"polluted": true}}')).toBe(false);
    });

    it("should return false for strings containing prototype", () => {
        expect(isValidFlagString('{"prototype": {"polluted": true}}')).toBe(false);
        expect(isValidFlagString('{"PROTOTYPE": {"polluted": true}}')).toBe(false);
    });

    it("should return false for strings containing __defineGetter__", () => {
        expect(isValidFlagString('{"__defineGetter__": "malicious"}')).toBe(false);
        expect(isValidFlagString('{"__DEFINEGETTER__": "malicious"}')).toBe(false);
    });

    it("should return false for strings containing __defineSetter__", () => {
        expect(isValidFlagString('{"__defineSetter__": "malicious"}')).toBe(false);
        expect(isValidFlagString('{"__DEFINESETTER__": "malicious"}')).toBe(false);
    });

    it("should return false for strings containing __lookupGetter__", () => {
        expect(isValidFlagString('{"__lookupGetter__": "malicious"}')).toBe(false);
        expect(isValidFlagString('{"__LOOKUPGETTER__": "malicious"}')).toBe(false);
    });

    it("should return false for strings containing __lookupSetter__", () => {
        expect(isValidFlagString('{"__lookupSetter__": "malicious"}')).toBe(false);
        expect(isValidFlagString('{"__LOOKUPSETTER__": "malicious"}')).toBe(false);
    });

    it("should be case-insensitive", () => {
        const dangerousStrings = ['{"__PrOtO__": true}', '{"CoNsTrUcToR": true}', '{"PrOtOtYpE": true}'];

        dangerousStrings.forEach((str) => {
            expect(isValidFlagString(str)).toBe(false);
        });
    });
});
