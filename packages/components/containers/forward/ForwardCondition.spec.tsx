import { render } from '@testing-library/react';
import type { MockedFunction } from 'vitest';

import { useNotifications } from '@proton/app-context/useNotifications';
import { ConditionType, FilterStatement } from '@proton/sieve/filterModel';

import type { Condition } from '../filters/interfaces';
import ForwardCondition from './ForwardCondition';

vi.mock('@proton/app-context/useNotifications');
const mockUseNotifications = useNotifications as MockedFunction<any>;
mockUseNotifications.mockReturnValue({
    createNotification: vi.fn(),
});

describe('ForwardCondition', () => {
    const setup = ({ index = 0, type = ConditionType.SUBJECT } = {}) => {
        const onDelete = vi.fn();
        const onUpdate = vi.fn();
        const onChangeStatement = vi.fn();
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
