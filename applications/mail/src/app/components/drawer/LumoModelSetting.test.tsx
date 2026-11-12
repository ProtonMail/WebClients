import { fireEvent, render, screen, within } from '@testing-library/react';

import { useUser } from '@proton/account/user/hooks';
import { buildUser } from '@proton/shared/testing/buildUser';

import { LumoModelChoice } from '../../lumo/useLumoModelChoice';
import LumoModelSetting from './LumoModelSetting';

jest.mock('@proton/account/user/hooks', () => {
    return { useUser: jest.fn() };
});

const user = buildUser();
const modelKey = `lumo-in-mail-model-${user.ID}`;
const enabledKey = `lumo-in-mail-enabled-${user.ID}`;

const getSelect = () => {
    return screen.getByTestId('mail-quick-settings:lumo-model-select');
};

const openSelect = () => {
    fireEvent.click(getSelect());
    return screen.getByTestId('select-list');
};

describe('LumoModelSetting', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.mocked(useUser).mockReturnValue([user, false]);
    });

    it('shows Lumo Max when nothing is stored', () => {
        render(<LumoModelSetting />);

        expect(getSelect()).toHaveTextContent('Lumo Max');
    });

    it('shows Lumo Lite when the user chose it', () => {
        localStorage.setItem(modelKey, JSON.stringify(LumoModelChoice.LITE));

        render(<LumoModelSetting />);

        expect(getSelect()).toHaveTextContent('Lumo Lite');
    });

    it('shows Lumo Max when the stored model is not one Mail offers', () => {
        localStorage.setItem(modelKey, '"apertus-15"');

        render(<LumoModelSetting />);

        expect(getSelect()).toHaveTextContent('Lumo Max');
    });

    it('lists Lumo Max then Lumo Lite, each with its description', () => {
        render(<LumoModelSetting />);

        const options = within(openSelect()).getAllByRole('button');

        expect(options.map((option) => option.textContent)).toEqual([
            'Lumo MaxHigh-performance model for complex tasks',
            'Lumo LiteLightweight model for everyday tasks',
        ]);
    });

    it('remembers the model the user picks', () => {
        render(<LumoModelSetting />);

        fireEvent.click(within(openSelect()).getByTitle('Lumo Lite'));

        expect(localStorage.getItem(modelKey)).toBe(JSON.stringify(LumoModelChoice.LITE));
        expect(getSelect()).toHaveTextContent('Lumo Lite');
    });

    it('renders nothing while Lumo is turned off', () => {
        localStorage.setItem(enabledKey, 'false');

        render(<LumoModelSetting />);

        expect(screen.queryByTestId('mail-quick-settings:lumo-model-select')).not.toBeInTheDocument();
    });
});
