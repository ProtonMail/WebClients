import { screen } from '@testing-library/dom';

import { easySwitchRender } from '../../../../tests/render';
import StepLoadingImporter from './StepLoadingImporter';

describe('Test correct rendering of loading importer', () => {
    it('Should render importer', () => {
        easySwitchRender(<StepLoadingImporter />);

        screen.getByTestId('StepLoadingImporter:modal');
    });
});
