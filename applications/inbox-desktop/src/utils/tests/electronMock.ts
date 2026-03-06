jest.mock("electron", () => ({
    app: {
        on: jest.fn(),
    },
    screen: {
        getDisplayNearestPoint: jest.fn(),
        getCursorScreenPoint: () => {},
    },
}));
