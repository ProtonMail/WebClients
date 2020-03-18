// I would love no to mock Squire
// But I'm stuck into a use of window.Range inside of Squire which seems not to work in JSDom

export default () => ({
    getFontInfo: jest.fn(() => ({})),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
});
