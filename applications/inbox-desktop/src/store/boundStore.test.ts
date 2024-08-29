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

jest.mock("../utils/view/viewManagement.ts", () => ({
    ZOOM_FACTOR_LIST: [1],
    getZoom: () => 1,
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
                zoom: 1,
            });

            expect(getWindowBounds()).toEqual({
                x: 123,
                y: 456,
                width: 1000,
                height: 500,
                maximized: false,
                zoom: 1,
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
                zoom: 1,
            });

            expect(getWindowBounds()).toEqual({
                x: 583,
                y: 746,
                width: 1000,
                height: 500,
                maximized: false,
                zoom: 1,
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
                zoom: 1,
            });

            expect(getWindowBounds()).toEqual({
                x: 584,
                y: 747,
                width: 1000,
                height: 500,
                maximized: false,
                zoom: 1,
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
                zoom: 1,
            });

            expect(getWindowBounds()).toEqual({
                x: 584,
                y: 747,
                width: 1000,
                height: 500,
                maximized: false,
                zoom: 1,
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
                zoom: 1,
            });
        });

        it("allows overriding window properties", () => {
            saveWindowBounds(
                {
                    getBounds: () => ({ x: 123, y: 456, width: 1000, height: 100 }),
                    isMaximized: () => true,
                } as BrowserWindow,
                { zoom: 1.33 },
            );

            expect(MockedStore.INSTANCE.set).toHaveBeenCalledWith("windowBounds", {
                x: 123,
                y: 456,
                width: 1000,
                height: 100,
                maximized: true,
                zoom: 1.33,
            });
        });
    });
});
