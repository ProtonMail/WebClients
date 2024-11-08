import { fireEvent, render } from '@testing-library/react';

import useNotifications from '@proton/components/hooks/useNotifications';

import type { Condition } from '../filters/interfaces';
import InputCondition from './InputCondition';

jest.mock('@proton/components/hooks/useNotifications');
const mockCreateNotification = jest.fn();
const mockUseNotifications = useNotifications as jest.MockedFunction<any>;
mockUseNotifications.mockReturnValue({
    createNotification: mockCreateNotification,
});

describe('InputCondition', () => {
    const setup = () => {
        const condition = {
            values: ['token1'],
        } as Condition;
        const onUpdate = jest.fn();
        const utils = render(<InputCondition index={0} condition={condition} onUpdate={onUpdate} />);
        const input = utils.getByRole('textbox');
        const removeButton = utils.getByTitle('Remove “token1”');
        return { ...utils, removeButton, input, onUpdate, condition };
    };

    describe('when we submit the input', () => {
        it('should add a token and clear the input', () => {
            const { input, onUpdate, condition } = setup();
            fireEvent.change(input, { target: { value: 'token2' } });
            expect(input).toHaveValue('token2');
            fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
            expect(onUpdate).toHaveBeenCalledWith({ ...condition, values: ['token1', 'token2'] });
            expect(input).toHaveValue('');
        });

        it('should only add non existing token', () => {
            const { input } = setup();
            fireEvent.change(input, { target: { value: 'token1' } });
            fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
            expect(input).toHaveValue('');
            expect(mockCreateNotification).toHaveBeenCalledWith({
                text: 'Token already exists',
                type: 'error',
            });
        });

        it('should not add empty token', () => {
            const { input, onUpdate, condition } = setup();
            fireEvent.change(input, { target: { value: '' } });
            fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
            expect(onUpdate).not.toHaveBeenCalledWith({ ...condition, values: ['token1', ''] });
        });
    });

    describe('when we blur the input', () => {
        it('should add a token and clear the input', () => {
            const { input, onUpdate, condition } = setup();
            fireEvent.change(input, { target: { value: 'token2' } });
            expect(input).toHaveValue('token2');
            fireEvent.blur(input);
            expect(onUpdate).toHaveBeenCalledWith({ ...condition, values: ['token1', 'token2'] });
            expect(input).toHaveValue('');
        });
    });

    describe('when we remove a token', () => {
        it('should remove the token', () => {
            const { removeButton, onUpdate, condition } = setup();
            fireEvent.click(removeButton);
            expect(onUpdate).toHaveBeenCalledWith({ ...condition, values: [] });
        });
    });
});
