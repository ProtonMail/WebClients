import { render, screen } from '@testing-library/react';

import { VolumeMeter } from './VolumeMeter';

describe('VolumeMeter', () => {
    const getMeter = () => screen.getByRole('meter');

    it('reflects the level on the meter value', () => {
        render(<VolumeMeter level={0.42} ariaLabel="Microphone input level" />);

        const meter = getMeter();
        expect(meter).toHaveAttribute('aria-valuenow', '0.42');
        expect(meter).toHaveAttribute('aria-valuemin', '0');
        expect(meter).toHaveAttribute('aria-valuemax', '1');
        expect(meter).toHaveAccessibleName('Microphone input level');
    });

    it('fills the track up to the level', () => {
        render(<VolumeMeter level={0.42} ariaLabel="Microphone input level" />);

        expect(getMeter().firstElementChild).toHaveStyle({ '--w-custom': '42%' });
    });

    it.each([
        ['above the maximum', 3, '1'],
        ['below the minimum', -2, '0'],
    ])('clamps a level %s', (_, level, expected) => {
        render(<VolumeMeter level={level} ariaLabel="Microphone input level" />);

        expect(getMeter()).toHaveAttribute('aria-valuenow', expected);
    });
});
