import { fireEvent, render, screen } from '@testing-library/react';

import { ADDON_NAMES, CYCLE, FREE_SUBSCRIPTION, PLANS, type PlanIDs, Renew } from '@proton/payments';
import { buildSubscription } from '@proton/testing/builders';
import { PLANS_MAP } from '@proton/testing/data';

import { type Props, ProtonPlanCustomizer } from './ProtonPlanCustomizer';

const onChangePlanIDsMock = jest.fn();

const defaultProps: Props = {
    scribeAddonEnabled: true,
    lumoAddonEnabled: true,
    loading: false,
    currency: 'EUR',
    cycle: CYCLE.MONTHLY,
    selectedPlanIDs: {
        [PLANS.MAIL]: 1,
    },
    onChangePlanIDs: onChangePlanIDsMock,
    plansMap: PLANS_MAP,
    latestSubscription: FREE_SUBSCRIPTION,
};

const mockUseFlag = jest.fn().mockReturnValue(false);
jest.mock('@proton/unleash', () => ({
    useFlag: (...args: any[]) => mockUseFlag(...args),
}));

beforeEach(() => {
    jest.clearAllMocks();
});

it('should render', () => {
    render(<ProtonPlanCustomizer {...defaultProps} />);
});

const lumoAddonBannerTestId = 'lumo-addon-banner';

it.each([
    {
        plan: PLANS.DRIVE,
        expectedCustomizers: [lumoAddonBannerTestId],
    },
    {
        plan: PLANS.DRIVE_PRO,
        expectedCustomizers: [`${ADDON_NAMES.MEMBER_DRIVE_PRO}-customizer`, lumoAddonBannerTestId],
    },
    {
        plan: PLANS.DRIVE_BUSINESS,
        expectedCustomizers: [`${ADDON_NAMES.MEMBER_DRIVE_BUSINESS}-customizer`, lumoAddonBannerTestId],
    },
    {
        plan: PLANS.PASS,
        expectedCustomizers: [lumoAddonBannerTestId],
    },
    {
        plan: PLANS.MAIL,
        expectedCustomizers: [lumoAddonBannerTestId],
    },
    {
        plan: PLANS.MAIL_PRO,
        expectedCustomizers: [
            `${ADDON_NAMES.MEMBER_MAIL_PRO}-customizer`,
            `${ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO}-customizer`,
            lumoAddonBannerTestId,
        ],
    },
    {
        plan: PLANS.MAIL_BUSINESS,
        expectedCustomizers: [
            `${ADDON_NAMES.MEMBER_MAIL_BUSINESS}-customizer`,
            `${ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS}-customizer`,
            lumoAddonBannerTestId,
        ],
    },
    {
        plan: PLANS.VPN2024,
        expectedCustomizers: [lumoAddonBannerTestId],
    },
    {
        plan: PLANS.BUNDLE,
        expectedCustomizers: [lumoAddonBannerTestId],
    },
    {
        plan: PLANS.BUNDLE_PRO,
        expectedCustomizers: [
            `${ADDON_NAMES.MEMBER_BUNDLE_PRO}-customizer`,
            `${ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO}-customizer`,
            `${ADDON_NAMES.IP_BUNDLE_PRO}-customizer`,
            lumoAddonBannerTestId,
        ],
    },
    {
        plan: PLANS.BUNDLE_PRO_2024,
        expectedCustomizers: [
            `${ADDON_NAMES.MEMBER_BUNDLE_PRO_2024}-customizer`,
            `${ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO_2024}-customizer`,
            `${ADDON_NAMES.IP_BUNDLE_PRO_2024}-customizer`,
            lumoAddonBannerTestId,
        ],
    },
    {
        plan: PLANS.FAMILY,
        expectedCustomizers: [lumoAddonBannerTestId],
    },
    {
        plan: PLANS.DUO,
        expectedCustomizers: [lumoAddonBannerTestId],
    },
    {
        plan: PLANS.VPN_PRO,
        expectedCustomizers: [`${ADDON_NAMES.MEMBER_VPN_PRO}-customizer`, lumoAddonBannerTestId],
    },
    {
        plan: PLANS.VPN_BUSINESS,
        expectedCustomizers: [
            `${ADDON_NAMES.MEMBER_VPN_BUSINESS}-customizer`,
            `${ADDON_NAMES.IP_VPN_BUSINESS}-customizer`,
            lumoAddonBannerTestId,
        ],
    },
    {
        plan: PLANS.PASS_PRO,
        expectedCustomizers: [`${ADDON_NAMES.MEMBER_PASS_PRO}-customizer`, lumoAddonBannerTestId],
    },
    {
        plan: PLANS.PASS_BUSINESS,
        expectedCustomizers: [`${ADDON_NAMES.MEMBER_PASS_BUSINESS}-customizer`, lumoAddonBannerTestId],
    },
    {
        plan: PLANS.PASS_FAMILY,
        expectedCustomizers: [lumoAddonBannerTestId],
    },
])('should show available addons for $plan', ({ plan, expectedCustomizers }) => {
    const props: Props = {
        ...defaultProps,
        selectedPlanIDs: {
            [plan]: 1,
        },
    };

    render(<ProtonPlanCustomizer {...props} />);

    expectedCustomizers.forEach((customizer) => {
        expect(screen.getByTestId(customizer)).toBeInTheDocument();
    });
});

it('should disable decrease button if the user cancelled the subscription', () => {
    const planIDs: PlanIDs = {
        [PLANS.MAIL_PRO]: 1,
        [ADDON_NAMES.MEMBER_MAIL_PRO]: 1,
    };

    const props: Props = {
        ...defaultProps,
        latestSubscription: buildSubscription(planIDs, {
            Renew: Renew.Disabled,
        }),
        selectedPlanIDs: planIDs,
    };

    render(<ProtonPlanCustomizer {...props} />);
    expect(screen.queryByTestId(`decrease-addon-${ADDON_NAMES.MEMBER_MAIL_PRO}`)).toBeDisabled();
    expect(screen.getByTestId('decrease-blocked-reason')).toBeInTheDocument();
});

const plansWithIpAddons = [
    {
        plan: PLANS.BUNDLE_PRO,
        addon: ADDON_NAMES.IP_BUNDLE_PRO,
    },
    {
        plan: PLANS.BUNDLE_PRO_2024,
        addon: ADDON_NAMES.IP_BUNDLE_PRO_2024,
    },
    {
        plan: PLANS.VPN_BUSINESS,
        addon: ADDON_NAMES.IP_VPN_BUSINESS,
    },
];

it.each(plansWithIpAddons)(
    'should enable decrease button if the feature flag is enabled - $plan',
    ({ plan, addon }) => {
        mockUseFlag.mockReturnValue(true);

        const planIDs: PlanIDs = {
            [plan]: 1,
            [addon]: 1,
        };

        const props: Props = {
            ...defaultProps,
            selectedPlanIDs: planIDs,
            latestSubscription: buildSubscription(planIDs),
        };

        render(<ProtonPlanCustomizer {...props} />);
        expect(screen.getByTestId(`decrease-addon-${addon}`)).toBeEnabled();
    }
);

it('should increase the number of scribes together with the number of members', async () => {
    const planIDs: PlanIDs = {
        [PLANS.MAIL_PRO]: 1, // 1 member
        [ADDON_NAMES.MEMBER_MAIL_PRO]: 1, // 1 member (so makes 2 members in total)
        [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 2, // 2 scribes
    };

    const props: Props = {
        ...defaultProps,
        selectedPlanIDs: planIDs,
        latestSubscription: buildSubscription(planIDs),
    };

    render(<ProtonPlanCustomizer {...props} />);

    const increaseMemberButton = screen.getByTestId(`increase-addon-${ADDON_NAMES.MEMBER_MAIL_PRO}`);

    fireEvent.click(increaseMemberButton);
    expect(onChangePlanIDsMock).toHaveBeenCalledWith({
        [PLANS.MAIL_PRO]: 1, // 1 member
        [ADDON_NAMES.MEMBER_MAIL_PRO]: 2, // 2 members (so makes 3 members in total)
        [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 3, // 3 scribes
    });
});

it('should decrease the number of scribes together with the number of members', async () => {
    const planIDs: PlanIDs = {
        [PLANS.MAIL_PRO]: 1, // 1 member
        [ADDON_NAMES.MEMBER_MAIL_PRO]: 1, // 1 member (so makes 2 members in total)
        [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 2, // 2 scribes
    };

    const props: Props = {
        ...defaultProps,
        selectedPlanIDs: planIDs,
        latestSubscription: buildSubscription(planIDs),
    };

    render(<ProtonPlanCustomizer {...props} />);

    const decreaseMemberButton = screen.getByTestId(`decrease-addon-${ADDON_NAMES.MEMBER_MAIL_PRO}`);
    fireEvent.click(decreaseMemberButton);
    expect(onChangePlanIDsMock).toHaveBeenCalledWith({
        [PLANS.MAIL_PRO]: 1, // 1 member
        [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 1, // 1 scribe
    });
});

it('should not increase the number of scribes if the number of members is not the same', async () => {
    const planIDs: PlanIDs = {
        [PLANS.MAIL_PRO]: 1, // 1 member
        [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 2, // 2 scribes
    };

    const props: Props = {
        ...defaultProps,
        selectedPlanIDs: planIDs,
        latestSubscription: buildSubscription(planIDs),
    };

    render(<ProtonPlanCustomizer {...props} />);

    const increaseMemberButton = screen.getByTestId(`increase-addon-${ADDON_NAMES.MEMBER_MAIL_PRO}`);
    fireEvent.click(increaseMemberButton);
    expect(onChangePlanIDsMock).toHaveBeenCalledWith({
        [PLANS.MAIL_PRO]: 1,
        [ADDON_NAMES.MEMBER_MAIL_PRO]: 1,
        [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 2,
    });
});

it('should not decrease the number of scribes if the number of members is not the same', async () => {
    const planIDs: PlanIDs = {
        [PLANS.MAIL_PRO]: 1, // 1 member
        [ADDON_NAMES.MEMBER_MAIL_PRO]: 2, // 2 members (so makes 3 members in total)
        [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 2, // 2 scribes
    };

    const props: Props = {
        ...defaultProps,
        selectedPlanIDs: planIDs,
        latestSubscription: buildSubscription(planIDs),
    };

    render(<ProtonPlanCustomizer {...props} />);

    const decreaseMemberButton = screen.getByTestId(`decrease-addon-${ADDON_NAMES.MEMBER_MAIL_PRO}`);
    fireEvent.click(decreaseMemberButton);
    expect(onChangePlanIDsMock).toHaveBeenCalledWith({
        [PLANS.MAIL_PRO]: 1,
        [ADDON_NAMES.MEMBER_MAIL_PRO]: 1,
        [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 2,
    });
});

it('should allow input of members through text field', async () => {
    const planIDs: PlanIDs = {
        [PLANS.MAIL_PRO]: 1, // 1 member
        [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 2, // 2 scribes
    };

    const props: Props = {
        ...defaultProps,
        selectedPlanIDs: planIDs,
        latestSubscription: buildSubscription(planIDs),
    };

    render(<ProtonPlanCustomizer {...props} />);

    const input = screen.getByTestId(`${ADDON_NAMES.MEMBER_MAIL_PRO}-customizer`);
    fireEvent.change(input, { target: { value: '10' } });
    expect(onChangePlanIDsMock).toHaveBeenCalledWith({
        [PLANS.MAIL_PRO]: 1,
        [ADDON_NAMES.MEMBER_MAIL_PRO]: 9,
        [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 10,
    });
});

it('should balance scribes and lumos when total exceeds members', () => {
    const planIDs: PlanIDs = {
        [PLANS.MAIL_PRO]: 1, // 1 member
        [ADDON_NAMES.MEMBER_MAIL_PRO]: 3, // 3 members (so makes 4 members in total)
        [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 4, // 4 scribes
    };

    const props: Props = {
        ...defaultProps,
        selectedPlanIDs: planIDs,
        latestSubscription: buildSubscription(planIDs),
    };

    const { rerender } = render(<ProtonPlanCustomizer {...props} />);

    // the banner Add Lumo button replaces all scribes with lumos
    const lumoBannerAddButton = screen.getByTestId(`lumo-addon-banner-add-button`);
    fireEvent.click(lumoBannerAddButton);
    const newPlanIDs = {
        [PLANS.MAIL_PRO]: 1,
        [ADDON_NAMES.MEMBER_MAIL_PRO]: 3,
        [ADDON_NAMES.LUMO_MAIL_PRO]: 4,
    };
    expect(onChangePlanIDsMock).toHaveBeenCalledWith(newPlanIDs);
    rerender(<ProtonPlanCustomizer {...props} selectedPlanIDs={newPlanIDs} />);

    // at this point we have max number of lumos so addon add button is disabled
    expect(screen.getByTestId(`increase-addon-${ADDON_NAMES.LUMO_MAIL_PRO}`)).toBeDisabled();

    // when we increase the number of scribes, the number of lumos should be reduced
    const increaseScribeButton = screen.getByTestId(`increase-addon-${ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO}`);
    fireEvent.click(increaseScribeButton);
    expect(onChangePlanIDsMock).toHaveBeenCalledWith({
        [PLANS.MAIL_PRO]: 1,
        [ADDON_NAMES.MEMBER_MAIL_PRO]: 3,
        [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 1,
        [ADDON_NAMES.LUMO_MAIL_PRO]: 3,
    });

    // when we increase the number of lumos then it should decrease the number of scribes
    const newPlanIDs2 = {
        [PLANS.MAIL_PRO]: 1,
        [ADDON_NAMES.MEMBER_MAIL_PRO]: 3,
        [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 1,
        [ADDON_NAMES.LUMO_MAIL_PRO]: 3,
    };
    rerender(<ProtonPlanCustomizer {...props} selectedPlanIDs={newPlanIDs2} />);
    const increaseLumoButton = screen.getByTestId(`increase-addon-${ADDON_NAMES.LUMO_MAIL_PRO}`);
    fireEvent.click(increaseLumoButton);
    expect(onChangePlanIDsMock).toHaveBeenCalledWith({
        [PLANS.MAIL_PRO]: 1,
        [ADDON_NAMES.MEMBER_MAIL_PRO]: 3,
        [ADDON_NAMES.LUMO_MAIL_PRO]: 4,
    });
});
