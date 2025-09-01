import { fireEvent, screen } from '@testing-library/dom';

import { easySwitchRender } from '@proton/activation/src/tests/render';

import ConfirmLeaveModal from './ConfirmLeaveModal';

describe('Test confirm leave modal', () => {
    it('Should trigger close events', () => {
        const handleClose = jest.fn();
        const handleContinue = jest.fn();

        easySwitchRender(<ConfirmLeaveModal handleClose={handleClose} handleContinue={handleContinue} />);

        const cancel = screen.getByTestId('ConfirmLeaveModal:discard');

        fireEvent.click(cancel);

        expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('Should trigger continue events', () => {
        const handleClose = jest.fn();
        const handleContinue = jest.fn();

        easySwitchRender(<ConfirmLeaveModal handleClose={handleClose} handleContinue={handleContinue} />);

        const submit = screen.getByTestId('ConfirmLeaveModal:continue');

        fireEvent.click(submit);

        expect(handleContinue).toHaveBeenCalledTimes(1);
    });
});
