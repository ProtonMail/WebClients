import { render } from '@testing-library/react';

import useNotifications from '@proton/components/hooks/useNotifications';

import type { Condition } from '../filters/interfaces';
import { ConditionType, FilterStatement } from '../filters/interfaces';
import ForwardCondition from './ForwardCondition';

jest.mock('@proton/components/hooks/useNotifications');
const mockUseNotifications = useNotifications as jest.MockedFunction<any>;
mockUseNotifications.mockReturnValue({
    createNotification: jest.fn(),
});

describe('ForwardCondition', () => {
    const setup = ({ index = 0, type = ConditionType.SUBJECT } = {}) => {
        const onDelete = jest.fn();
        const onUpdate = jest.fn();
        const onChangeStatement = jest.fn();
        const condition = { type, values: ['token1', 'token2'] } as Condition;
        const statement = FilterStatement.ALL;
        const utils = render(
            <ForwardCondition
                statement={statement}
                condition={condition}
                displayDelete
                index={index}
                onDelete={onDelete}
                onUpdate={onUpdate}
                onChangeStatement={onChangeStatement}
            />
        );
        return { ...utils, onDelete, onUpdate, onChangeStatement };
    };

    describe('when we click on the "Delete" button', () => {
        it('should call the onDelete function', () => {
            const { getByTestId, onDelete } = setup();
            getByTestId('forward:condition:delete-button_0').click();
            expect(onDelete).toHaveBeenCalled();
        });
    });

    test('only the first condition should have an "If" label', () => {
        const { getByText } = setup();
        expect(getByText('If')).toBeInTheDocument();
        const { getByTestId } = setup({ index: 1 });
        expect(getByTestId('forward:condition:ifor-select_1')).toBeInTheDocument();
    });

    describe('when condition type is "Attachments"', () => {
        it('should render the attachment inputs', () => {
            const { getByText } = setup({ type: ConditionType.ATTACHMENTS });
            expect(getByText('With attachment')).toBeInTheDocument();
            expect(getByText('Without attachment')).toBeInTheDocument();
        });
    });
});
