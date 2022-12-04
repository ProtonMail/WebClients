import { fireEvent, screen } from '@testing-library/dom';

import { easySwitchRender } from '@proton/activation/tests/render';

import ConfirmLeaveModal from './ConfirmLeaveModal';

describe('Test confirm leave modal', () => {
    it('Should trigger close and continue events', () => {
        const handleClose = jest.fn();
        const handleContinue = jest.fn();

        easySwitchRender(<ConfirmLeaveModal handleClose={handleClose} handleContinue={handleContinue} />);

        const cancel = screen.getByTestId('ConfirmLeaveModal:discard');
        const submit = screen.getByTestId('ConfirmLeaveModal:continue');

        fireEvent.click(cancel);
        fireEvent.click(submit);

        expect(handleClose).toBeCalledTimes(1);
        expect(handleContinue).toBeCalledTimes(1);
    });
});
