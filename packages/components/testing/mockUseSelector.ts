import * as useSelectorModule from 'react-redux';

// A simple workaround for jest issue not solved yet
// https://stackoverflow.com/questions/67872622/jest-spyon-not-working-on-index-file-cannot-redefine-property
jest.mock('react-redux', () => {
    return {
        __esModule: true,
        ...jest.requireActual('react-redux'),
    };
});

export const mockUseSelector = (value?: Partial<ReturnType<typeof useSelectorModule.useSelector>>) => {
    const mockedUseSelector = jest.spyOn(useSelectorModule, 'useSelector');
    mockedUseSelector.mockReturnValue(value);
    return mockedUseSelector;
};
