// I would love no to mock Squire
// But I'm stuck into a use of window.Range inside of Squire which seems not to work in JSDom

const instance = {
    setHTML: jest.fn(),
    getFontInfo: jest.fn(() => ({})),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    forEachBlock: jest.fn(),
    fireEvent: jest.fn(),
    focus: jest.fn(),
    getPath: jest.fn(),
};

export default () => instance;
