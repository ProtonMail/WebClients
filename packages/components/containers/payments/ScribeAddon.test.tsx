import { fireEvent, render, screen } from '@testing-library/react';

import type { Plan } from '@proton/payments';
import { ADDON_NAMES } from '@proton/payments';
import { Audience } from '@proton/shared/lib/interfaces';
import { PLANS_MAP } from '@proton/testing/data/payments/data-plans';

import ScribeAddon from './ScribeAddon';

jest.mock('@proton/components/containers/payments/subscription/assistant/helpers', () => ({
    getScribeUpsellText: () => 'AI-powered writing assistant',
    getScribeUpsellLearnMore: () => 'https://proton.me/support',
}));

const addon = PLANS_MAP[ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO] as Plan;
const scribeTestId = `${ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO}-customizer`;

const baseProps = {
    price: <span>€3</span>,
    addon,
    value: 2,
    max: 5,
    min: 0,
    decreaseBlockedReasons: [],
    increaseBlockedReasons: [],
    onAddScribe: jest.fn(),
    mode: undefined as 'signup' | undefined,
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe('ScribeAddon', () => {
    it('shows the B2B banner when mode=signup and audience=B2B', () => {
        render(<ScribeAddon {...baseProps} mode="signup" audience={Audience.B2B} />);

        expect(screen.getByRole('button', { name: /^add$/i })).toBeInTheDocument();
        expect(screen.queryByTestId(scribeTestId)).not.toBeInTheDocument();
    });

    it('shows NumberCustomiser when mode=undefined and audience=B2B', () => {
        render(<ScribeAddon {...baseProps} mode={undefined} audience={Audience.B2B} />);

        expect(screen.queryByRole('button', { name: /^add$/i })).not.toBeInTheDocument();
        expect(screen.getByTestId(scribeTestId)).toBeInTheDocument();
    });

    it('shows NumberCustomiser when mode=signup but audience is not B2B', () => {
        render(<ScribeAddon {...baseProps} mode="signup" audience={Audience.B2C} />);

        expect(screen.queryByRole('button', { name: /^add$/i })).not.toBeInTheDocument();
        expect(screen.getByTestId(scribeTestId)).toBeInTheDocument();
    });

    it('clicking the banner calls onAddScribe and replaces the banner with the NumberCustomiser', () => {
        const onAddScribe = jest.fn();
        render(<ScribeAddon {...baseProps} mode="signup" audience={Audience.B2B} onAddScribe={onAddScribe} />);

        fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

        expect(onAddScribe).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('button', { name: /^add$/i })).not.toBeInTheDocument();
        expect(screen.getByTestId(scribeTestId)).toBeInTheDocument();
    });
});
