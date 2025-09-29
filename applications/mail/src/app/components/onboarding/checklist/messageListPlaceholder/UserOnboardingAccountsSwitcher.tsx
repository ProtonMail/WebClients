import { memo, useState } from 'react';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { Button, ButtonLike, type ButtonLikeSize, Tooltip } from '@proton/atoms';
import { Icon, useActiveBreakpoint, useModalStateObject, useMyCountry, useNotifications } from '@proton/components';
import { TelemetryMailOnboardingEvents } from '@proton/shared/lib/api/telemetry';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';
import { sortAddresses } from '@proton/shared/lib/mail/addresses';
import clsx from '@proton/utils/clsx';

import { useMailOnboardingTelemetry } from 'proton-mail/components/onboarding/useMailOnboardingTelemetry';
import { useGetStartedChecklist } from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';

import { ONLINE_SERVICES } from '../constants';
import UpdateMailAddressModal from './UpdateMailAddressModal';
import { getFinanceServicesByCountry } from './onboardingAccountSwitcher.helpers';

type Category = 'finance' | 'social-media' | 'shopping';

interface TabProps {
    categories: { id: Category; name: string }[];
    onClick: (clickedCategory: Category) => void;
    selectedID: string;
    size: ButtonLikeSize;
}

const Pills = ({ categories, onClick, selectedID, size }: TabProps) => (
    <div className="inline-flex gap-0.5 sm:gap-1 md:gap-4 flex-row">
        {categories.map(({ name, id }) => (
            <Button
                className={selectedID === id ? '' : 'color-weak'}
                color="weak"
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

const TabContent = memo(({ selectedCategory }: { selectedCategory: Category }) => {
    const { viewportWidth } = useActiveBreakpoint();
    const sendMailOnboardingTelemetry = useMailOnboardingTelemetry();
    const countryLocation = useMyCountry();
    const servicesKeys = getFinanceServicesByCountry({ category: selectedCategory, countryLocation }) || [];

    return (
        <ul key={selectedCategory} className="unstyled mx-0 my-4 divide-y divide-weak">
            {servicesKeys.map((key) => {
                const service = ONLINE_SERVICES[key];
                if (!service) {
                    return null;
                }

                return (
                    <li key={service.key} className="flex flex-row flex-nowrap items-center py-3">
                        <img
                            alt=""
                            src={service.img}
                            className="w-custom h-custom shrink-0 ml-1"
                            style={{
                                '--w-custom': '2rem',
                                '--h-custom': '2rem',
                            }}
                        />
                        <span className="flex-1 text-left px-2 color-weak text-ellipsis" title={service.name}>
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
                                <Icon name="arrow-within-square" alt={c('Action').t`Change email`} />
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

const UserOnboardingAccountsSwitcher = ({ className }: { className?: string }) => {
    const [addresses] = useAddresses();
    const [selectedCategory, setSelectedCategory] = useState<Category>('finance');
    const sortedAddresses = sortAddresses(addresses || []);
    const updateMailAddressModal = useModalStateObject();
    const { createNotification } = useNotifications();
    const { viewportWidth } = useActiveBreakpoint();
    const { changeChecklistDisplay, canDisplayChecklist, markItemsAsDone } = useGetStartedChecklist();
    const sendMailOnboardingTelemetry = useMailOnboardingTelemetry();

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
            <div
                data-testid="onboarding-accounts-switcher"
                className={clsx('m-auto max-w-custom py-6', className)}
                style={{ '--max-w-custom': '28rem' }}
            >
                <div className="text-center mb-4 mx-4">
                    <h1 className="text-rg text-semibold color-weak mb-3">{c('Onboarding List Placeholder')
                        .t`Privacy for all your online accounts`}</h1>
                    <p className="color-weak text-sm m-0 mb-4">
                        {c('Onboarding List Placeholder')
                            .jt`Change your email address for popular services now to avoid being tracked and profiled. ${learnMoreLink}`}
                    </p>
                    {!!defaultEmailAddress && (
                        <Tooltip title={c('Action').t`Click to copy ${defaultEmailAddress} to clipboard`}>
                            <Button
                                color="weak"
                                shape="outline"
                                size="small"
                                className="bg-transparent color-weak inline-flex items-center flex-nowrap"
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
                        'border-weak pt-4 px-3 sm:px-4 md:px-6 text-center',
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
                <div className="text-center mb-4">
                    <Button shape="underline" className="mt-4 color-weak" onClick={handleChangeChecklistDisplay}>{c(
                        'Onboarding List Placeholder'
                    ).t`Maybe later`}</Button>
                </div>
            </div>
            {updateMailAddressModal.render && <UpdateMailAddressModal {...updateMailAddressModal.modalProps} />}
        </>
    );
};

export default UserOnboardingAccountsSwitcher;
