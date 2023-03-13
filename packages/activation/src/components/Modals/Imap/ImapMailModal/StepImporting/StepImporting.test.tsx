import { fireEvent, screen } from '@testing-library/dom';

import { easySwitchRender } from '@proton/activation/src/tests/render';

import StepImporting from './StepImporting';

describe('Step importing basic rendering testing', () => {
    it('Should correctly render the step importing', () => {
        easySwitchRender(<StepImporting />);

        const closeButton = screen.getByTestId('StepImport:closeButton');
        fireEvent.click(closeButton);
    });

    it('Should redirect user when not in easy switch', () => {
        easySwitchRender(<StepImporting />);

        const redirectButton = screen.getByTestId('StepImport:redirectButton');
        fireEvent.click(redirectButton);
    });
});
