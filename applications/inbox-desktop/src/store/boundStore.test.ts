import { BrowserWindow, Display, screen } from "electron";
import { Singleton, getSingleton } from "../utils/testUtils";
import { WindowBounds, getWindowBounds, saveWindowBounds } from "./boundsStore";
import Store from "electron-store";

const MockedStore = Store as unknown as Singleton<{
    get: jest.MockedFn<() => WindowBounds>;
    set: () => void;
}>;

jest.mock("electron-store", () =>
    getSingleton<(typeof MockedStore)["INSTANCE"]>(() => ({
        get: jest.fn(),
        set: jest.fn(),
    })),
);

jest.mock("electron", () => ({
    screen: {
        getDisplayNearestPoint: jest.fn(),
        getCursorScreenPoint: () => {},
    },
}));

jest.mock("../utils/view/windowBounds.ts", () => ({
    ensureWindowIsVisible: () => {},
}));

describe("boundStore", () => {
    describe("getWindowBounds", () => {
        it("returns stored window bounds", () => {
            MockedStore.INSTANCE.get.mockReturnValue({
                x: 123,
                y: 456,
                width: 1000,
                height: 500,
                maximized: false,
            });

            expect(getWindowBounds()).toEqual({
                x: 123,
                y: 456,
                width: 1000,
                height: 500,
                maximized: false,
            });
        });

        it("detaults to the center of the nearest display", () => {
            (screen.getDisplayNearestPoint as jest.MockedFn<typeof screen.getDisplayNearestPoint>).mockReturnValue({
                workArea: {
                    x: 123,
                    y: 456,
                    width: 1920,
                    height: 1080,
                },
            } as Display);

            MockedStore.INSTANCE.get.mockReturnValue({
                x: -1,
                y: -1,
                width: 1000,
                height: 500,
                maximized: false,
            });

            expect(getWindowBounds()).toEqual({
                x: 583,
                y: 746,
                width: 1000,
                height: 500,
                maximized: false,
            });
        });

        it("rounds to the nearest integer when centering the window", () => {
            (screen.getDisplayNearestPoint as jest.MockedFn<typeof screen.getDisplayNearestPoint>).mockReturnValue({
                workArea: {
                    x: 123,
                    y: 456,
                    width: 1921,
                    height: 1081,
                },
            } as Display);

            MockedStore.INSTANCE.get.mockReturnValue({
                x: -1,
                y: -1,
                width: 1000,
                height: 500,
                maximized: false,
            });

            expect(getWindowBounds()).toEqual({
                x: 584,
                y: 747,
                width: 1000,
                height: 500,
                maximized: false,
            });
        });

        it("rounds to the nearest integer when centering the window", () => {
            (screen.getDisplayNearestPoint as jest.MockedFn<typeof screen.getDisplayNearestPoint>).mockReturnValue({
                workArea: {
                    x: 123,
                    y: 456,
                    width: 1921,
                    height: 1081,
                },
            } as Display);

            MockedStore.INSTANCE.get.mockReturnValue({
                x: -1,
                y: -1,
                width: 1000,
                height: 500,
                maximized: false,
            });

            expect(getWindowBounds()).toEqual({
                x: 584,
                y: 747,
                width: 1000,
                height: 500,
                maximized: false,
            });
        });
    });

    describe("saveWindowBounds", () => {
        it("stores given window bounds", () => {
            saveWindowBounds({
                getBounds: () => ({ x: 123, y: 456, width: 1000, height: 100 }),
                isMaximized: () => true,
            } as BrowserWindow);

            expect(MockedStore.INSTANCE.set).toHaveBeenCalledWith("windowBounds", {
                x: 123,
                y: 456,
                width: 1000,
                height: 100,
                maximized: true,
            });
        });
    });
});
