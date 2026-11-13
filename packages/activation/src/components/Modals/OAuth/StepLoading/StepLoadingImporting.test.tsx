import { screen } from '@testing-library/dom';
import { type MockedFunction, vi } from 'vitest';

import { easySwitchRender } from '../../../../tests/render';
import StepLoadingImporting from './StepLoadingImporting';
import useStepLoadingImporting from './useStepLoadingImporting';

vi.mock('./useStepLoadingImporting', () => ({
    __esModule: true,
    default: vi.fn(),
}));

const mockStepLoadingImporting = useStepLoadingImporting as any as MockedFunction<typeof useStepLoadingImporting>;

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
