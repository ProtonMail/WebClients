import { render } from '@testing-library/react';

import useNotifications from '@proton/components/hooks/useNotifications';

import { ConditionComparator, ConditionType, FilterStatement } from '../filters/interfaces';
import ForwardConditions from './ForwardConditions';

jest.mock('@proton/components/hooks/useNotifications');
const mockUseNotifications = useNotifications as jest.MockedFunction<any>;
mockUseNotifications.mockReturnValue({
    createNotification: jest.fn(),
});

describe('ForwardConditions', () => {
    const setup = ({ statement = FilterStatement.ALL } = {}) => {
        const onChangeStatement = jest.fn();
        const onChangeConditions = jest.fn();
        const validator = jest.fn();
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
