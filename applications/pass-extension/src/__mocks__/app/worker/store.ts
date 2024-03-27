import { getMockState } from 'proton-pass-extension/__mocks__/mocks';

const store = {
    dispatch: jest.fn().mockReturnValue(getMockState()),
    getState: jest.fn(),
};

export default store;
