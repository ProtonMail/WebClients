import { Display, Rectangle, screen } from "electron";
import { ensureWindowIsVisible } from "./windowBounds";

jest.mock("electron", () => ({
    screen: {
        getDisplayMatching: jest.fn(),
    },
}));

const mockDisplay = (workArea: Rectangle) => {
    (screen.getDisplayMatching as jest.MockedFn<typeof screen.getDisplayMatching>).mockReturnValue({
        workArea,
    } as Display);
};

describe("windowBounds", () => {
    describe("ensureWindowIsVisible", () => {
        it("moves the window to the left if needed", () => {
            mockDisplay({ x: 0, y: 0, width: 1280, height: 720 });
            const windowBounds: Rectangle = { x: 300, y: 0, width: 1000, height: 720 };
            expect(ensureWindowIsVisible(windowBounds)).toEqual({ x: 280, y: 0, width: 1000, height: 720 });
        });

        it("moves the window to the right if needed", () => {
            mockDisplay({ x: 0, y: 0, width: 1280, height: 720 });
            const windowBounds: Rectangle = { x: -100, y: 0, width: 1000, height: 720 };
            expect(ensureWindowIsVisible(windowBounds)).toEqual({ x: 0, y: 0, width: 1000, height: 720 });
        });

        it("moves the window up if needed", () => {
            mockDisplay({ x: 0, y: 0, width: 1280, height: 720 });
            const windowBounds: Rectangle = { x: 0, y: 400, width: 1000, height: 420 };
            expect(ensureWindowIsVisible(windowBounds)).toEqual({ x: 0, y: 300, width: 1000, height: 420 });
        });

        it("moves the window down if needed", () => {
            mockDisplay({ x: 0, y: 0, width: 1280, height: 720 });
            const windowBounds: Rectangle = { x: 0, y: -400, width: 1000, height: 420 };
            expect(ensureWindowIsVisible(windowBounds)).toEqual({ x: 0, y: 0, width: 1000, height: 420 });
        });
    });
});
