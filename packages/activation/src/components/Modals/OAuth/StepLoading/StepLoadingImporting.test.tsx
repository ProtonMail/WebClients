import { screen } from '@testing-library/dom';

import { easySwitchRender } from '@proton/activation/src/tests/render';

import StepLoadingImporting from './StepLoadingImporting';
import useStepLoadingImporting from './useStepLoadingImporting';

jest.mock('./useStepLoadingImporting', () => ({
    __esModule: true,
    default: jest.fn(),
}));

const mockStepLoadingImporting = useStepLoadingImporting as any as jest.Mock<
    ReturnType<typeof useStepLoadingImporting>
>;

describe('Test correct rendering of loading importing different states', () => {
    it('Should render creating importing calendar state', () => {
        mockStepLoadingImporting.mockImplementation(() => {
            return {
                createdCalendarCount: 10,
                calendarsToBeCreated: 10,
                isCreatingCalendar: true,
                isCreatingImportTask: false,
            };
        });

        easySwitchRender(<StepLoadingImporting />);
        screen.getByTestId('StepLoadingImporting:modal');
    });

    it('Should render creating importing finishing state', () => {
        mockStepLoadingImporting.mockImplementation(() => {
            return {
                createdCalendarCount: 10,
                calendarsToBeCreated: 10,
                isCreatingCalendar: false,
                isCreatingImportTask: true,
            };
        });

        easySwitchRender(<StepLoadingImporting />);
        screen.getByTestId('StepLoadingImporting:modal');
    });

    it('Should render empty state', () => {
        mockStepLoadingImporting.mockImplementation(() => {
            return {
                createdCalendarCount: 10,
                calendarsToBeCreated: 10,
                isCreatingCalendar: false,
                isCreatingImportTask: false,
            };
        });

        easySwitchRender(<StepLoadingImporting />);
        screen.getByTestId('StepLoadingImporting:modal');
    });
});
