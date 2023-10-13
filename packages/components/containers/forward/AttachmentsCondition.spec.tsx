import { render } from '@testing-library/react';

import { Condition, ConditionComparator } from '../filters/interfaces';
import AttachmentsCondition from './AttachmentsCondition';

describe('AttachmentsCondition', () => {
    const condition1 = { comparator: ConditionComparator.DOES_NOT_CONTAIN } as Condition;
    const condition2 = { comparator: ConditionComparator.CONTAINS } as Condition;
    const onUpdate = jest.fn();

    describe('when we click on the "With attachment" radio', () => {
        it('should call the onUpdate function with the right condition', () => {
            const { getByText } = render(<AttachmentsCondition index={0} condition={condition1} onUpdate={onUpdate} />);
            getByText('With attachment').click();
            expect(onUpdate).toHaveBeenCalledWith({ comparator: ConditionComparator.CONTAINS });
        });
    });

    describe('when we click on the "Without attachment" radio', () => {
        it('should call the onUpdate function with the right condition', () => {
            const { getByText } = render(<AttachmentsCondition index={0} condition={condition2} onUpdate={onUpdate} />);
            getByText('Without attachment').click();
            expect(onUpdate).toHaveBeenCalledWith({ comparator: ConditionComparator.DOES_NOT_CONTAIN });
        });
    });
});
