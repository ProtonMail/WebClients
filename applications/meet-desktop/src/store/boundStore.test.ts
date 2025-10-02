import { BrowserWindow, Display, screen } from "electron";
import { getWindowBounds, saveWindowBounds } from "./boundsStore";
import { MockedStore } from "../utils/tests/electronStoreMock";

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
        it("does nothing if window is destroyed", () => {
            saveWindowBounds({
                isDestroyed: () => true,
                getBounds: () => ({ x: 123, y: 456, width: 1000, height: 100 }),
                isMaximized: () => true,
            } as BrowserWindow);

            expect(MockedStore.INSTANCE.set).not.toHaveBeenCalled();
        });

        it("stores given window bounds", () => {
            saveWindowBounds({
                isDestroyed: () => false,
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
                    isDestroyed: () => false,
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
