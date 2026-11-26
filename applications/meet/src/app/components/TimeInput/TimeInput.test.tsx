import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { enUS, fi } from 'date-fns/locale';

import { setDateLocales } from '@proton/shared/lib/i18n';
import { SETTINGS_TIME_FORMAT } from '@proton/shared/lib/interfaces/UserSettings';

import { TimeInput } from './TimeInput';

const renderTimeInput = (value: string) => {
    const onChange = vi.fn();
    render(
        <TimeInput
            aria-label="Start time"
            value={value}
            onChange={onChange}
            options={[]}
            timeFormat={SETTINGS_TIME_FORMAT.H24}
        />
    );
    return { onChange, input: screen.getByRole('textbox', { name: 'Start time' }) };
};

describe('TimeInput', () => {
    afterEach(() => {
        setDateLocales({ dateLocale: enUS });
    });

    it.each([
        { typed: 'abc', reported: 'abc' },
        { typed: '25:99', reported: '25:99' },
        { typed: '14:30', reported: '14:30' },
        { typed: '2:30 PM', reported: '14:30' },
    ])('reports "$reported" when "$typed" is typed and the field is left', async ({ typed, reported }) => {
        const user = userEvent.setup();
        const { onChange, input } = renderTimeInput('10:00');

        await user.tab();
        await user.clear(input);
        await user.keyboard(typed);
        await user.tab();

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(reported);
    });

    it('reports a time typed the way a Finnish field shows it', async () => {
        setDateLocales({ dateLocale: fi });
        const user = userEvent.setup();
        const { onChange, input } = renderTimeInput('10:00');

        await user.tab();
        await user.clear(input);
        await user.keyboard('14.45');
        await user.tab();

        expect(onChange).toHaveBeenCalledWith('14:45');
    });

    it('reports an empty time when the field is cleared and left', async () => {
        const user = userEvent.setup();
        const { onChange, input } = renderTimeInput('10:00');

        await user.tab();
        await user.clear(input);
        await user.tab();

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('');
    });

    it('reports nothing when the field is left without an edit', async () => {
        const user = userEvent.setup();
        const { onChange } = renderTimeInput('10:00');

        await user.tab();
        await user.tab();

        expect(onChange).not.toHaveBeenCalled();
    });

    it('shows a value that is not a time as it was typed', () => {
        const { input } = renderTimeInput('25:99');

        expect(input).toHaveValue('25:99');
    });
});
