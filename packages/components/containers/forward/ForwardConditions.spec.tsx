import { render } from '@testing-library/react';
import type { MockedFunction } from 'vitest';

import { useNotifications } from '@proton/app-context/useNotifications';
import { ConditionComparator, ConditionType, FilterStatement } from '@proton/sieve/filterModel';

import ForwardConditions from './ForwardConditions';

vi.mock('@proton/app-context/useNotifications');
const mockUseNotifications = useNotifications as MockedFunction<any>;
mockUseNotifications.mockReturnValue({
    createNotification: vi.fn(),
});

describe('ForwardConditions', () => {
    const setup = ({ statement = FilterStatement.ALL } = {}) => {
        const onChangeStatement = vi.fn();
        const onChangeConditions = vi.fn();
        const validator = vi.fn();
        const conditions = [
            {
                id: 'id1',
                type: ConditionType.SENDER,
                values: ['token1', 'token2'],
                comparator: ConditionComparator.CONTAINS,
                isOpen: true,
            },
            {
                id: 'id2',
                type: ConditionType.SUBJECT,
                values: ['token1', 'token2'],
                comparator: ConditionComparator.CONTAINS,
                isOpen: true,
            },
            {
                id: 'id3',
                type: ConditionType.SUBJECT,
                values: ['token1', 'token2'],
                comparator: ConditionComparator.CONTAINS,
                isOpen: true,
            },
            {
                id: 'id4',
                type: ConditionType.SUBJECT,
                values: ['token1', 'token2'],
                comparator: ConditionComparator.CONTAINS,
                isOpen: true,
            },
        ];
        const utils = render(
            <ForwardConditions
                statement={statement}
                onChangeConditions={onChangeConditions}
                onChangeStatement={onChangeStatement}
                validator={validator}
                conditions={conditions}
            />
        );
        return { ...utils, conditions, onChangeStatement, onChangeConditions };
    };

    describe('when the statement change', () => {
        it('should change all statements', () => {
            const { getAllByText, conditions } = setup();
            const numberOfSelect = conditions.length - 1;
            expect(getAllByText('And')).toHaveLength(numberOfSelect);
            expect(setup({ statement: FilterStatement.ANY }).getAllByText('Or')).toHaveLength(numberOfSelect);
        });
    });

    test('only the first condition should have an "If" label', () => {
        const { getAllByText } = setup();
        expect(getAllByText('If')).toHaveLength(1);
    });

    it('should have 1 delete button per condition', () => {
        const { getAllByTestId, conditions } = setup();
        expect(getAllByTestId('forward:condition:delete-button_', { exact: false })).toHaveLength(conditions.length);
    });
});
