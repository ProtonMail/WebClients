import { render } from '@testing-library/react';

import { Condition } from '../filters/interfaces';
import TokensCondition from './TokensCondition';

describe('TokensCondition', () => {
    const setup = () => {
        const condition = {
            values: ['token1', 'token2'],
        } as Condition;
        const onRemove = jest.fn();
        const utils = render(<TokensCondition condition={condition} onRemove={onRemove} />);
        return { ...utils, condition, onRemove };
    };

    it('should render a list of condition tokens', () => {
        const { getByText } = setup();
        expect(getByText('token1')).toBeInTheDocument();
        expect(getByText('token2')).toBeInTheDocument();
    });

    it('should render a remove button for each token', () => {
        const { getAllByRole } = setup();
        expect(getAllByRole('button')).toHaveLength(2);
    });

    it('should call onRemove when clicking on a remove button', () => {
        const { getAllByRole, onRemove } = setup();
        getAllByRole('button')[0].click();
        expect(onRemove).toHaveBeenCalledWith(0);
    });
});
