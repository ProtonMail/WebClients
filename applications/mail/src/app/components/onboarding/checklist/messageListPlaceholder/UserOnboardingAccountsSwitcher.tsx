import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import useNotifications from '@proton/components/hooks/useNotifications';
import { IcSquares } from '@proton/icons/icons/IcSquares';
import { TelemetryMailOnboardingEvents } from '@proton/shared/lib/api/telemetry';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';
import { sortAddresses } from '@proton/shared/lib/mail/addresses';
import checklistAccountsSwitcherImg from '@proton/styles/assets/img/illustrations/checklist-accounts-switcher.svg';

import { ONLINE_SERVICES } from 'proton-mail/components/onboarding/checklist/constants';
import { useMailOnboardingTelemetry } from 'proton-mail/components/onboarding/useMailOnboardingTelemetry';
import { useGetStartedChecklist } from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';

import UpdateMailAddressModal from './UpdateMailAddressModal';

const UserOnboardingAccountsSwitcher = () => {
    const [addresses] = useAddresses();
    const sortedAddresses = sortAddresses(addresses || []);
    const updateMailAddressModal = useModalStateObject();
    const { createNotification } = useNotifications();
    const { changeChecklistDisplay, canDisplayChecklist } = useGetStartedChecklist();
    const sendMailOnboardingTelemetry = useMailOnboardingTelemetry();

    if (!canDisplayChecklist) {
        return null;
    }

    const handleChangeChecklistDisplay = () => {
        changeChecklistDisplay(CHECKLIST_DISPLAY_TYPE.REDUCED);
        void sendMailOnboardingTelemetry(TelemetryMailOnboardingEvents.finish_change_login, {});
    };

    const defaultEmailAddress: string | undefined = sortedAddresses?.[0]?.Email;

    return (
        <>
            <div
                data-testid="onboarding-accounts-switcher"
                className="m-auto max-w-custom py-6"
                style={{ '--max-w-custom': '28rem' }}
            >
                <div className="text-center mb-4 mx-4">
                    <img src={checklistAccountsSwitcherImg} alt="" className="mb-4" width={80} />
                    <h1 className="text-lg text-semibold mb-3">{c('Onboarding List Placeholder')
                        .t`Switch your accounts to ${BRAND_NAME}`}</h1>
                    <p className="color-weak m-0 mb-4">
                        {c('Onboarding List Placeholder')
                            .t`Update your email on the services you use the most. Prevent tracking and protect your privacy.`}
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
                                <IcSquares className="ml-4" />
                            </Button>
                        </Tooltip>
                    )}
                </div>
                <p className="text-sm color-weak text-center">{c('Onboarding List Placeholder').t`Popular services`}</p>
                <div className="border-weak px-2 text-center flex gap-2 justify-center">
                    {ONLINE_SERVICES.map((service) => {
                        return (
                            <ButtonLike
                                key={service.name}
                                as="a"
                                href={service.url}
                                rel="noopener noreferrer"
                                target="_blank"
                                onClick={() => {
                                    void sendMailOnboardingTelemetry(TelemetryMailOnboardingEvents.change_login, {
                                        service: service.key,
                                    });
                                }}
                                className="inline-flex items-center justify-center rounded-lg shrink-0 gap-2"
                            >
                                <img src={service.img} alt="" width={16} />
                                <span>{service.name}</span>
                            </ButtonLike>
                        );
                    })}
                </div>
                <div className="text-center mb-4">
                    <Button
                        shape="underline"
                        className="mt-4 color-weak text-sm"
                        onClick={handleChangeChecklistDisplay}
                    >{c('Onboarding List Placeholder').t`Skip for now`}</Button>
                </div>
            </div>
            {updateMailAddressModal.render && <UpdateMailAddressModal {...updateMailAddressModal.modalProps} />}
        </>
    );
};

export default UserOnboardingAccountsSwitcher;
