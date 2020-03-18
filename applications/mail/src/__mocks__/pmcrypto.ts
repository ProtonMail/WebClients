export const getKeys = jest.fn((key: string) => key);

export const encryptMessage = jest.fn(() => ({}));

export const splitMessage = jest.fn(() => ({
    asymmetric: [],
    encrypted: []
}));
