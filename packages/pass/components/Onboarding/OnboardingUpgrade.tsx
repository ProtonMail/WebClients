import { type FC, type ReactNode, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import RadioGroup from '@proton/components/components/input/RadioGroup';
import CalendarLogo from '@proton/components/components/logo/CalendarLogo';
import DriveLogo from '@proton/components/components/logo/DriveLogo';
import MailLogo from '@proton/components/components/logo/MailLogo';
import PassLogo from '@proton/components/components/logo/PassLogo';
import VpnLogo from '@proton/components/components/logo/VpnLogo';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableHeaderCell from '@proton/components/components/table/TableHeaderCell';
import TableRow from '@proton/components/components/table/TableRow';
import { useOnline } from '@proton/pass/components/Core/ConnectivityProvider';
import { useOnboarding } from '@proton/pass/components/Onboarding/OnboardingProvider';
import { PASS_PLUS_LIFETIME_PRICE, PASS_PLUS_PRICE, PROTON_UNLIMITED_PRICE, UpsellRef } from '@proton/pass/constants';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { useNavigateToUpgrade } from '@proton/pass/hooks/useNavigateToUpgrade';
import { getUserCurrency, supportedCurrencies } from '@proton/pass/lib/user/user.currency';
import { selectUser } from '@proton/pass/store/selectors';
import { PassFeature } from '@proton/pass/types/api/features';
import { PLANS, PLAN_NAMES } from '@proton/payments';
import {
    BRAND_NAME,
    CALENDAR_SHORT_APP_NAME,
    DARK_WEB_MONITORING_NAME,
    DRIVE_SHORT_APP_NAME,
    MAIL_SHORT_APP_NAME,
    PASS_SHORT_APP_NAME,
    VPN_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import './OnboardingUpgrade.scss';

export type AvailablePlans = PLANS.PASS | PLANS.BUNDLE;
type FeaturesTable = {
    comparisons: { label: string; badge?: 'light' | 'dark' }[];
    included: {
        title: string;
        currentPlan?: string;
        nextPlan: ReactNode;
    }[];
};

const CheckIcon = () => <Icon name="checkmark-circle-filled" size={4} />;
const InfiniteIcon = () => <div className="text-lg">∞</div>;

const getTableContent = (freeCcFlag: boolean): Record<AvailablePlans, FeaturesTable> => ({
    [PLANS.PASS]: {
        comparisons: [{ label: c('Label').t`Free` }, { label: c('Label').t`Plus`, badge: 'dark' }],
        included: [
            { title: c('Label').t`Hide-my-email aliases`, currentPlan: '10', nextPlan: <InfiniteIcon /> },
            { title: c('Label').t`Built-in 2FA`, nextPlan: <CheckIcon /> },
            { title: c('Label').t`Vault, item & link sharing`, nextPlan: <CheckIcon /> },
            ...(freeCcFlag ? [] : [{ title: c('Label').t`Credit cards`, nextPlan: <InfiniteIcon /> }]),
            { title: DARK_WEB_MONITORING_NAME, nextPlan: <CheckIcon /> },
            { title: c('Label').t`File attachments`, nextPlan: '10 GB' },
        ],
    },
    [PLANS.BUNDLE]: {
        comparisons: [
            { label: c('Label').t`Plus`, badge: 'dark' },
            { label: c('Label').t`Unlimited`, badge: 'light' },
        ],
        included: [
            { title: c('Label').t`Storage`, currentPlan: '10 GB', nextPlan: '500 GB' },
            { title: c('Label').t`Extra email addresses`, currentPlan: '1', nextPlan: '15' },
            { title: c('Label').t`VPN Devices`, currentPlan: '1', nextPlan: '10' },
            {
                title: c('Label').t`VPN Speed`,
                currentPlan: c('Medium').t`Plus`,
                nextPlan: c('Label').t`Highest`,
            },
        ],
    },
});

const getProtonProducts = () => [
    { icon: PassLogo, name: PASS_SHORT_APP_NAME },
    { icon: MailLogo, name: MAIL_SHORT_APP_NAME },
    { icon: CalendarLogo, name: CALENDAR_SHORT_APP_NAME },
    { icon: DriveLogo, name: DRIVE_SHORT_APP_NAME },
    { icon: VpnLogo, name: VPN_SHORT_APP_NAME },
];

export const Content: FC = () => {
    const { selected = PLANS.PASS } = useOnboarding<AvailablePlans>();
    const online = useOnline();
    const freeCcFlag = useFeatureFlag(PassFeature.PassAllowCreditCardFreeUsers);
    const passLifetimeFlag = useFeatureFlag(PassFeature.PassWebDesktopLifetimeBanner);
    const includesFeatures = useMemo(() => getTableContent(freeCcFlag), [freeCcFlag]);
    const protonProducts = useMemo(getProtonProducts, []);
    const navigateToLifetimeUpgrade = useNavigateToUpgrade({
        plan: PLANS.PASS_LIFETIME,
        upsellRef: UpsellRef.LIFETIME_PLAN_ONBOARDING,
    });
    const user = useSelector(selectUser);
    const plusLifetimePrice = getSimplePriceString(getUserCurrency(user?.Currency), PASS_PLUS_LIFETIME_PRICE);
    const displayLifetimeCard = passLifetimeFlag && supportedCurrencies.includes(user?.Currency ?? '');
    const plusTitle = PLAN_NAMES[PLANS.PASS];

    return (
        <section className="pass-onboarding-upgrade">
            {selected === PLANS.PASS ? (
                displayLifetimeCard && (
                    <div className="relative">
                        <div className="description--banner-card flex justify-space-between rounded-lg p-3 gap-2">
                            <div className="description--banner-card-content">
                                <div className="text-semibold">{c('PassOnboardingOffer')
                                    .t`${plusTitle} Lifetime for ${plusLifetimePrice}`}</div>
                                <div className="text-sm color-weak">{c('Title').t`Pay once, access forever.`}</div>
                            </div>
                            <Button
                                className="button-invert"
                                pill
                                shape="solid"
                                color="norm"
                                onClick={navigateToLifetimeUpgrade}
                                disabled={!online}
                            >
                                {c('Action').t`Pay once`}
                            </Button>
                        </div>
                    </div>
                )
            ) : (
                <div>
                    <h2 className="w-full text-center text-lg text-bold">{c('Label')
                        .t`The best of ${BRAND_NAME} with one subscription`}</h2>
                    <div className="flex justify-space-between mt-4">
                        {protonProducts.map(({ icon: Icon, name }) => (
                            <div key={name} className="flex flex-column items-center">
                                <Icon variant="glyph-only" />
                                <div>{name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <Table className="table--main-content mt-4">
                <TableHeader>
                    <TableRow>
                        <TableHeaderCell className="w-1/2">{c('Label').t`What's included`}</TableHeaderCell>
                        {includesFeatures[selected].comparisons.map(({ label, badge }) => (
                            <TableHeaderCell key={label} className="text-center">
                                <div
                                    className={clsx(
                                        'text-sm rounded-xl py-1',
                                        badge === 'light' && 'bg-invert color-invert',
                                        badge === 'dark' && 'bg-strong'
                                    )}
                                >
                                    {label}
                                </div>
                            </TableHeaderCell>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {includesFeatures[selected].included.map((row) => (
                        <TableRow className="pass-table--row" key={row.title}>
                            <TableCell className="pass-table--row-title" title={row.title}>
                                {row.title}
                            </TableCell>
                            <TableCell className="text-center">{row.currentPlan ?? '-'}</TableCell>
                            <TableCell className="text-center">{row.nextPlan}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </section>
    );
};

type PassPlanOption = {
    value: AvailablePlans;
    title: ReactNode;
    label: ReactNode;
};

export const Description: FC = () => {
    const { selected = PLANS.PASS, setSelected } = useOnboarding<AvailablePlans>();
    const online = useOnline();
    const user = useSelector(selectUser);

    const changePlan = (selected: AvailablePlans) => setSelected?.(selected);

    const currency = getUserCurrency(user?.Currency);
    const plansOptions = useMemo<PassPlanOption[]>(() => {
        const [passPlusPrice, protonUnlimitedPrice] = [PASS_PLUS_PRICE, PROTON_UNLIMITED_PRICE].map((price) =>
            getSimplePriceString(currency, price)
        );

        // Moved into a function since the label is the same, but the variable changes (preventing lint error)
        const getPriceLabel = (price: string) => c('PassOnboardingOffer').t`${price}/month`;

        return [
            {
                value: PLANS.PASS,
                title: PLAN_NAMES[PLANS.PASS],
                label: getPriceLabel(passPlusPrice),
            },
            {
                value: PLANS.BUNDLE,
                title: PLAN_NAMES[PLANS.BUNDLE],
                label: getPriceLabel(protonUnlimitedPrice),
            },
        ];
    }, [currency]);

    return (
        <>
            <span className="block mb-5 color-weak">{c('Info')
                .t`Trusted by over 50,000 business users and 100 million accounts around the world.`}</span>

            <RadioGroup<AvailablePlans>
                name="upgrade-plan"
                onChange={changePlan}
                value={selected}
                className={clsx('pass-onboarding-modal--radio w-full', !online && 'opacity-70 pointer-events-none')}
                disableChange={!online}
                options={plansOptions.map(({ value, title, label }) => ({
                    value,
                    label: (
                        <div className="pass-onboarding-modal--option-dense rounded-xl flex items-center w-full py-3 px-4">
                            <div className="flex-1">
                                <div className={clsx('text-bold', selected === value ? 'color-invert' : 'color-norm')}>
                                    {title}
                                </div>
                                <div
                                    className={clsx(
                                        'text-sm text-',
                                        selected === value ? 'color-invert' : 'color-weak'
                                    )}
                                >
                                    {label}
                                </div>
                            </div>
                            {selected === value && (
                                <Icon name="chevron-right" size={4} color="var(--interaction-weak)" />
                            )}
                        </div>
                    ),
                }))}
            />
        </>
    );
};
