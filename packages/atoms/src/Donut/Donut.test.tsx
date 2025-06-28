import { render } from '@testing-library/react';

import { ThemeColor } from '@proton/colors/types';

import { Donut } from './Donut';

describe('<Donut />', () => {
    it('renders specified segments', () => {
        const { container } = render(
            <Donut
                segments={[
                    [20, ThemeColor.Danger],
                    [10, ThemeColor.Warning],
                ]}
            />
        );

        expect(container.querySelectorAll('rect')).toHaveLength(4);
        expect(container.querySelectorAll('circle')).toHaveLength(3);
    });
});
