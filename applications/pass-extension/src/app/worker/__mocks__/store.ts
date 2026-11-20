import { getMockState } from '../../../__mocks__/mocks';

const store = {
    dispatch: vi.fn().mockReturnValue(getMockState()),
    dispatchAsyncRequest: vi.fn(),
    getState: vi.fn(),
};

export default store;
