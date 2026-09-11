jest.unmock("./safeStore");

let capturedDeserialize: (text: string) => unknown;

jest.mock("electron-store", () => {
    return class MockStore {
        constructor(options: { deserialize?: (text: string) => unknown }) {
            if (options?.deserialize) {
                capturedDeserialize = options.deserialize;
            }
        }
    };
});

jest.mock("electron-log", () => {
    const mockErrorFn = jest.fn();
    return {
        scope: () => ({ error: mockErrorFn }),
    };
});

import Logger from "electron-log";
import { SafeStore } from "./safeStore";

const mockError = Logger.scope("").error as jest.Mock;

describe("SafeStore", () => {
    describe("safeDeserialize", () => {
        beforeEach(() => {
            mockError.mockClear();
            new SafeStore("test-store");
        });

        it("parses valid JSON", () => {
            const result = capturedDeserialize('{"key": "value"}');
            expect(result).toEqual({ key: "value" });
        });

        it("does not log on valid JSON", () => {
            capturedDeserialize('{"key": "value"}');
            expect(mockError).not.toHaveBeenCalled();
        });

        it("throws on invalid JSON", () => {
            expect(() => capturedDeserialize("{corrupted")).toThrow();
        });

        it("logs store name and file name on corruption", () => {
            try {
                capturedDeserialize("{corrupted");
            } catch {
                // expected
            }

            expect(mockError).toHaveBeenCalledWith(
                expect.stringContaining('"test-store"'),
                expect.objectContaining({
                    error: expect.any(String),
                    snippet: expect.any(String),
                }),
            );
        });

        it("includes default file name in corruption log", () => {
            try {
                capturedDeserialize("{corrupted");
            } catch {
                // expected
            }

            expect(mockError).toHaveBeenCalledWith(expect.stringContaining('"config"'), expect.any(Object));
        });

        it("logs snippet of corrupted text (first 100 chars)", () => {
            const longCorrupted = "x".repeat(200);
            try {
                capturedDeserialize(longCorrupted);
            } catch {
                // expected
            }

            const loggedSnippet = mockError.mock.calls[0][1].snippet;
            expect(loggedSnippet).toHaveLength(100);
        });

        it("logs typeof when input is not a string", () => {
            try {
                capturedDeserialize(undefined as unknown as string);
            } catch {
                // expected
            }

            const loggedSnippet = mockError.mock.calls[0][1].snippet;
            expect(loggedSnippet).toBe("undefined");
        });
    });

    describe("constructor", () => {
        beforeEach(() => {
            mockError.mockClear();
        });

        it("uses custom file name from options.name in log", () => {
            new SafeStore("my-store", { name: "custom-file" });

            try {
                capturedDeserialize("{bad");
            } catch {
                // expected
            }

            expect(mockError).toHaveBeenCalledWith(expect.stringContaining('"custom-file"'), expect.any(Object));
        });

        it("defaults file name to 'config' when no name option", () => {
            new SafeStore("my-store");

            try {
                capturedDeserialize("{bad");
            } catch {
                // expected
            }

            expect(mockError).toHaveBeenCalledWith(expect.stringContaining('"config"'), expect.any(Object));
        });
    });
});
