import { fireEvent, render, screen } from '@testing-library/react';

import {
    ADDON_NAMES,
    CYCLE,
    FREE_SUBSCRIPTION,
    type FreeSubscription,
    PLANS,
    type PlanIDs,
    Renew,
    type Subscription,
} from '@proton/payments';
import { buildSubscription } from '@proton/testing/builders/subscription';
import { PLANS_MAP } from '@proton/testing/data/payments/data-plans';

import { type Props, ProtonPlanCustomizer } from './ProtonPlanCustomizer';

const onChangePlanIDsMock = jest.fn();

const mockUseFlag = jest.fn().mockReturnValue(false);
jest.mock('@proton/unleash/useFlag', () => ({
    useFlag: (...args: any[]) => mockUseFlag(...args),
}));

jest.mock('@proton/components/hooks/useConfig', () => ({
    __esModule: true,
    default: jest.fn().mockReturnValue({
        APP_NAME: 'proton-account',
    }),
}));

beforeEach(() => {
    jest.clearAllMocks();
    mockUseFlag.mockReturnValue(false);
});

const buildProps = ({
    selectedPlanIDs,
    latestSubscription = FREE_SUBSCRIPTION,
    scribeAddonEnabled = true,
    lumoAddonEnabled = true,
    loading = false,
}: {
    selectedPlanIDs: PlanIDs;
    latestSubscription?: Subscription | FreeSubscription;
    scribeAddonEnabled?: boolean;
    lumoAddonEnabled?: boolean;
    loading?: boolean;
}): Props => ({
    currency: 'EUR',
    cycle: CYCLE.MONTHLY,
    selectedPlanIDs,
    onChangePlanIDs: onChangePlanIDsMock,
    plansMap: PLANS_MAP,
    loading,
    latestSubscription,
    addonFlags: { scribeAddonEnabled, lumoAddonEnabled, meetAddonEnabled: false },
    telemetryContext: 'other',
});

const defaultProps = buildProps({ selectedPlanIDs: {} });

it('should render', () => {
    render(<ProtonPlanCustomizer {...buildProps({ selectedPlanIDs: { [PLANS.MAIL]: 1 } })} />);
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
    {
        plan: PLANS.VPN_PASS_BUNDLE_BUSINESS,
        expectedCustomizers: [`${ADDON_NAMES.MEMBER_VPN_PASS_BUNDLE_BUSINESS}-customizer`, lumoAddonBannerTestId],
    },
    {
        plan: PLANS.LUMO_BUSINESS,
        expectedCustomizers: [`${ADDON_NAMES.MEMBER_LUMO_BUSINESS}-customizer`],
    },
])('should show available addons for $plan', ({ plan, expectedCustomizers }) => {
    render(<ProtonPlanCustomizer {...buildProps({ selectedPlanIDs: { [plan]: 1 } })} />);

    expectedCustomizers.forEach((customizer) => {
        expect(screen.getByTestId(customizer)).toBeInTheDocument();
    });
});

it('should disable decrease button if the user cancelled the subscription', () => {
    const planIDs: PlanIDs = {
        [PLANS.MAIL_PRO]: 1,
        [ADDON_NAMES.MEMBER_MAIL_PRO]: 1,
    };

    render(
        <ProtonPlanCustomizer
            {...buildProps({
                selectedPlanIDs: planIDs,
                latestSubscription: buildSubscription(planIDs, { Renew: Renew.Disabled }),
            })}
        />
    );
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

        render(
            <ProtonPlanCustomizer
                {...buildProps({ selectedPlanIDs: planIDs, latestSubscription: buildSubscription(planIDs) })}
            />
        );
        expect(screen.getByTestId(`decrease-addon-${addon}`)).toBeEnabled();
    }
);

it('should increase the number of scribes together with the number of members', async () => {
    const planIDs: PlanIDs = {
        [PLANS.MAIL_PRO]: 1, // 1 member
        [ADDON_NAMES.MEMBER_MAIL_PRO]: 1, // 1 member (so makes 2 members in total)
        [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 2, // 2 scribes
    };

    render(
        <ProtonPlanCustomizer
            {...buildProps({ selectedPlanIDs: planIDs, latestSubscription: buildSubscription(planIDs) })}
        />
    );

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

    render(
        <ProtonPlanCustomizer
            {...buildProps({ selectedPlanIDs: planIDs, latestSubscription: buildSubscription(planIDs) })}
        />
    );

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

    render(
        <ProtonPlanCustomizer
            {...buildProps({ selectedPlanIDs: planIDs, latestSubscription: buildSubscription(planIDs) })}
        />
    );

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

    render(
        <ProtonPlanCustomizer
            {...buildProps({ selectedPlanIDs: planIDs, latestSubscription: buildSubscription(planIDs) })}
        />
    );

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

    render(
        <ProtonPlanCustomizer
            {...buildProps({ selectedPlanIDs: planIDs, latestSubscription: buildSubscription(planIDs) })}
        />
    );

    const input = screen.getByTestId(`${ADDON_NAMES.MEMBER_MAIL_PRO}-customizer`);
    fireEvent.change(input, { target: { value: '10' } });
    expect(onChangePlanIDsMock).toHaveBeenCalledWith({
        [PLANS.MAIL_PRO]: 1,
        [ADDON_NAMES.MEMBER_MAIL_PRO]: 9,
        [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 10,
    });
});

describe('domain addon gating (VPN_BUSINESS)', () => {
    const domainCustomizerId = `${ADDON_NAMES.DOMAIN_VPN_BUSINESS}-customizer`;

    it('renders the domain customizer when DomainVpnBiz2023 flag is true', () => {
        mockUseFlag.mockImplementation((flag: string) => flag === 'DomainVpnBiz2023');
        const planIDs: PlanIDs = { [PLANS.VPN_BUSINESS]: 1 };

        render(
            <ProtonPlanCustomizer
                {...defaultProps}
                selectedPlanIDs={planIDs}
                latestSubscription={buildSubscription(planIDs)}
            />
        );

        expect(screen.getByTestId(domainCustomizerId)).toBeInTheDocument();
    });

    it('hides the domain customizer when DomainVpnBiz2023 flag is false and no domain addons are selected', () => {
        const planIDs: PlanIDs = { [PLANS.VPN_BUSINESS]: 1 };

        render(
            <ProtonPlanCustomizer
                {...defaultProps}
                selectedPlanIDs={planIDs}
                latestSubscription={buildSubscription(planIDs)}
            />
        );

        expect(screen.queryByTestId(domainCustomizerId)).not.toBeInTheDocument();
    });

    it('still renders the domain customizer when disabled but domain addons are already purchased (grandfathered)', () => {
        const planIDs: PlanIDs = {
            [PLANS.VPN_BUSINESS]: 1,
            [ADDON_NAMES.DOMAIN_VPN_BUSINESS]: 2,
        };

        render(
            <ProtonPlanCustomizer
                {...defaultProps}
                selectedPlanIDs={planIDs}
                latestSubscription={buildSubscription(planIDs)}
            />
        );

        expect(screen.getByTestId(domainCustomizerId)).toBeInTheDocument();
    });

    it('still renders the domain customizer when latestSubscription has domain addons but selectedPlanIDs does not (regression: must use currentPlan not selectedPlan)', () => {
        const latestPlanIDs: PlanIDs = {
            [PLANS.VPN_BUSINESS]: 1,
            [ADDON_NAMES.DOMAIN_VPN_BUSINESS]: 2,
        };

        render(
            <ProtonPlanCustomizer
                {...defaultProps}
                selectedPlanIDs={{ [PLANS.VPN_BUSINESS]: 1 }}
                latestSubscription={buildSubscription(latestPlanIDs)}
            />
        );

        expect(screen.getByTestId(domainCustomizerId)).toBeInTheDocument();
    });

    it('does not affect member or IP customizers when DomainVpnBiz2023 flag is false', () => {
        const planIDs: PlanIDs = { [PLANS.VPN_BUSINESS]: 1 };

        render(
            <ProtonPlanCustomizer
                {...defaultProps}
                selectedPlanIDs={planIDs}
                latestSubscription={buildSubscription(planIDs)}
            />
        );

        expect(screen.getByTestId(`${ADDON_NAMES.MEMBER_VPN_BUSINESS}-customizer`)).toBeInTheDocument();
        expect(screen.getByTestId(`${ADDON_NAMES.IP_VPN_BUSINESS}-customizer`)).toBeInTheDocument();
    });

    it('does not affect non-VPN_BUSINESS domain addons when DomainVpnBiz2023 flag is false', () => {
        const planIDs: PlanIDs = { [PLANS.BUNDLE_PRO_2024]: 1 };

        render(
            <ProtonPlanCustomizer
                {...defaultProps}
                selectedPlanIDs={planIDs}
                latestSubscription={buildSubscription(planIDs)}
            />
        );

        expect(screen.getByTestId(`${ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024}-customizer`)).toBeInTheDocument();
    });
});

it('should balance scribes and lumos when total exceeds members', () => {
    const planIDs: PlanIDs = {
        [PLANS.MAIL_PRO]: 1, // 1 member
        [ADDON_NAMES.MEMBER_MAIL_PRO]: 3, // 3 members (so makes 4 members in total)
        [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 4, // 4 scribes
    };

    const { rerender } = render(
        <ProtonPlanCustomizer
            {...buildProps({ selectedPlanIDs: planIDs, latestSubscription: buildSubscription(planIDs) })}
        />
    );

    // the banner Add Lumo button replaces all scribes with lumos
    const lumoBannerAddButton = screen.getByTestId(`lumo-addon-banner-add-button`);
    fireEvent.click(lumoBannerAddButton);
    const newPlanIDs = {
        [PLANS.MAIL_PRO]: 1,
        [ADDON_NAMES.MEMBER_MAIL_PRO]: 3,
        [ADDON_NAMES.LUMO_MAIL_PRO]: 4,
    };
    expect(onChangePlanIDsMock).toHaveBeenCalledWith(newPlanIDs);
    rerender(
        <ProtonPlanCustomizer
            {...buildProps({ selectedPlanIDs: newPlanIDs, latestSubscription: buildSubscription(planIDs) })}
        />
    );

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
    rerender(
        <ProtonPlanCustomizer
            {...buildProps({ selectedPlanIDs: newPlanIDs2, latestSubscription: buildSubscription(planIDs) })}
        />
    );
    const increaseLumoButton = screen.getByTestId(`increase-addon-${ADDON_NAMES.LUMO_MAIL_PRO}`);
    fireEvent.click(increaseLumoButton);
    expect(onChangePlanIDsMock).toHaveBeenCalledWith({
        [PLANS.MAIL_PRO]: 1,
        [ADDON_NAMES.MEMBER_MAIL_PRO]: 3,
        [ADDON_NAMES.LUMO_MAIL_PRO]: 4,
    });
});
