import { memo, useState } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike, type ButtonLikeSize } from '@proton/atoms';
import { Icon, Tooltip, useModalStateObject } from '@proton/components';
import { useActiveBreakpoint, useAddresses, useMyCountry, useNotifications } from '@proton/components/hooks';
import { TelemetryMailOnboardingEvents } from '@proton/shared/lib/api/telemetry';
import { BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';
import { sortAddresses } from '@proton/shared/lib/mail/addresses';
import clsx from '@proton/utils/clsx';

import { useMailOnboardingTelemetry } from 'proton-mail/components/onboarding/useMailOnboardingTelemetry';
import { useGetStartedChecklist } from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';

import { ONLINE_SERVICES, type OnlineServicesKey } from '../../../constants';
import UpdateMailAddressModal from './UpdateMailAddressModal';

type Category = 'finance' | 'social-media' | 'shopping';

interface TabProps {
    categories: { id: Category; name: string }[];
    className?: string;
    onClick: (clickedCategory: Category) => void;
    selectedID: string;
    size: ButtonLikeSize;
}

const Pills = ({ categories, onClick, selectedID, className, size }: TabProps) => (
    <div className="inline-flex gap-0.5 sm:gap-1 md:gap-4 flex-row">
        {categories.map(({ name, id }) => (
            <Button
                className={clsx([selectedID === id && 'button-solid-norm-light', className])}
                color={selectedID === id ? 'norm' : 'weak'}
                shape={selectedID === id ? 'solid' : 'ghost'}
                key={id}
                pill
                onClick={() => onClick(id)}
                size={size}
            >
                {name}
            </Button>
        ))}
    </div>
);

const getFinanceServicesByCountry = ({
    category,
    countryLocation,
}: {
    category: 'finance' | 'social-media' | 'shopping';
    countryLocation: string | undefined;
}) => {
    if (category === 'finance') {
        if (countryLocation === 'GB') {
            return ['hsbc', 'barclays', 'lloyds'] satisfies OnlineServicesKey[];
        }
        if (countryLocation === 'FR') {
            return ['bnp-paribas', 'credit-agricole', 'banque-populaire'] satisfies OnlineServicesKey[];
        }
        if (countryLocation === 'DE') {
            return ['deutsche-bank', 'dz-bank', 'kfw'] satisfies OnlineServicesKey[];
        }
        if (countryLocation === 'ES') {
            return ['santander', 'bbva', 'caixa-bank'] satisfies OnlineServicesKey[];
        }
        if (countryLocation === 'CH') {
            return ['ubs', 'raiffeisen', 'zurcher-kantonalbank'] satisfies OnlineServicesKey[];
        }
        // Default to US
        return ['bank-of-america', 'american-express', 'capital-one'] satisfies OnlineServicesKey[];
    } else if (category === 'social-media') {
        return ['facebook', 'instagram', 'tiktok'] satisfies OnlineServicesKey[];
    } else if (category === 'shopping') {
        return ['amazon', 'ebay', 'aliexpress'] satisfies OnlineServicesKey[];
    } else {
        throw new Error('Invalid category');
    }
};

const TabContent = memo(({ selectedCategory }: { selectedCategory: Category }) => {
    const { viewportWidth } = useActiveBreakpoint();
    const [sendMailOnboardingTelemetry] = useMailOnboardingTelemetry();
    const [countryLocation] = useMyCountry();
    const servicesKeys = getFinanceServicesByCountry({ category: selectedCategory, countryLocation }) || [];

    return (
        <ul key={selectedCategory} className="unstyled mx-0 my-4 divide-y divide-weak">
            {servicesKeys.map((key) => {
                const service = ONLINE_SERVICES[key];
                if (!service) {
                    return null;
                }

                return (
                    <li key={service.key} className="flex flex-row flex-nowrap items-center py-4">
                        <img
                            alt=""
                            src={service.img}
                            className="w-custom h-custom shrink-0 ml-1"
                            style={{
                                '--w-custom': '2rem',
                                '--h-custom': '2rem',
                            }}
                        />
                        <span className="flex-1 text-left px-2 text-ellipsis" title={service.name}>
                            {service.name}
                        </span>
                        <ButtonLike
                            as="a"
                            href={service.url}
                            rel="noopener noreferrer"
                            size={viewportWidth.xsmall ? 'medium' : 'small'}
                            target="_blank"
                            onClick={() => {
                                void sendMailOnboardingTelemetry(TelemetryMailOnboardingEvents.change_login, {
                                    service: key,
                                });
                            }}
                            className="shrink-0"
                            icon={viewportWidth.xsmall}
                            pill={viewportWidth.xsmall}
                        >
                            {viewportWidth.xsmall ? (
                                <Icon name="arrow-out-square" alt={c('Action').t`Change email`} />
                            ) : (
                                c('Action').t`Change email`
                            )}
                        </ButtonLike>
                    </li>
                );
            })}
        </ul>
    );
});
TabContent.displayName = 'TabContent';

const UsersOnboardingReplaceAccountPlaceholder = ({ className }: { className?: string }) => {
    const [addresses] = useAddresses();
    const [selectedCategory, setSelectedCategory] = useState<Category>('finance');
    const sortedAddresses = sortAddresses(addresses || []);
    const updateMailAddressModal = useModalStateObject();
    const { createNotification } = useNotifications();
    const { viewportWidth } = useActiveBreakpoint();
    const { changeChecklistDisplay, canDisplayChecklist, markItemsAsDone } = useGetStartedChecklist();
    const [sendMailOnboardingTelemetry] = useMailOnboardingTelemetry();

    if (!canDisplayChecklist) {
        return null;
    }

    const handleChangeChecklistDisplay = () => {
        changeChecklistDisplay(CHECKLIST_DISPLAY_TYPE.REDUCED);
        markItemsAsDone('AccountLogin');
        void sendMailOnboardingTelemetry(TelemetryMailOnboardingEvents.finish_change_login, {});
    };

    const learnMoreLink = (
        <Button
            key="learn-more-link-change-addresses"
            shape="underline"
            color="norm"
            className="p-0 inline-block"
            onClick={() => updateMailAddressModal.openModal(true)}
        >{c('Link').t`Learn more`}</Button>
    );

    const categories: { id: Category; name: string }[] = [
        { id: 'finance', name: c('Onboarding List Placeholder').t`Finance` },
        { id: 'social-media', name: c('Onboarding List Placeholder').t`Social media` },
        { id: 'shopping', name: c('Onboarding List Placeholder').t`Shopping` },
    ];

    const defaultEmailAddress: string | undefined = sortedAddresses?.[0]?.Email;

    return (
        <>
            <div className={clsx('m-auto max-w-custom py-6', className)} style={{ '--max-w-custom': '35rem' }}>
                <div className="text-center mb-6 mx-4">
                    <h1 className="text-4xl text-bold mb-3">{c('Onboarding List Placeholder')
                        .t`Privacy for all your online accounts`}</h1>
                    <p className="text-weak mt-0">
                        {c('Onboarding List Placeholder')
                            .jt`Use your ${MAIL_APP_NAME} address to sign in to online services to avoid being tracked and profiled. Change your email for popular services now. ${learnMoreLink}`}
                    </p>
                    {!!defaultEmailAddress && (
                        <Tooltip title={c('Action').t`Click to copy ${defaultEmailAddress} to clipboard`}>
                            <Button
                                color="weak"
                                shape="outline"
                                size="small"
                                className="bg-transparent inline-flex items-center flex-nowrap"
                                onClick={() => {
                                    textToClipboard(defaultEmailAddress);
                                    createNotification({
                                        text: c('Info').t`Email copied to clipboard`,
                                    });
                                }}
                            >
                                {defaultEmailAddress}
                                <Icon className="ml-4" name="squares" />
                            </Button>
                        </Tooltip>
                    )}
                </div>
                <div
                    className={clsx([
                        'bg-norm border-weak pt-4 px-3 sm:px-4 md:px-8 mx-0 sm:mx-4 text-center',
                        viewportWidth.xsmall ? 'border-top border-bottom' : 'border rounded-xl',
                    ])}
                >
                    <Pills
                        size={viewportWidth.xsmall ? 'small' : 'medium'}
                        categories={categories}
                        selectedID={selectedCategory}
                        onClick={setSelectedCategory}
                    />
                    <TabContent selectedCategory={selectedCategory} />
                </div>
                <div className="text-center mb-4 mx-4">
                    <Button shape="underline" className="mt-4 color-weak" onClick={handleChangeChecklistDisplay}>{c(
                        'Onboarding List Placeholder'
                    ).t`I have moved my logins to ${BRAND_NAME}`}</Button>
                </div>
            </div>
            {updateMailAddressModal.render && <UpdateMailAddressModal {...updateMailAddressModal.modalProps} />}
        </>
    );
};

export default UsersOnboardingReplaceAccountPlaceholder;
