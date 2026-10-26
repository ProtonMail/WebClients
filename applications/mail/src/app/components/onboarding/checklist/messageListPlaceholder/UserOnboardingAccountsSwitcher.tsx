import { useEffect } from 'react';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import { IcSquares } from '@proton/icons/icons/IcSquares';
import { OldTelemetryMailOnboardingEvents } from '@proton/shared/lib/api/telemetry';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';
import { sortAddresses } from '@proton/shared/lib/mail/addresses';
import checklistAccountsSwitcherImg from '@proton/styles/assets/img/illustrations/checklist-accounts-switcher.svg';

import { useGetStartedChecklist } from '../../../../containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import { CHECKLIST_ACTIONS, CHECKLIST_REDUCE_TRIGGERS, CHECKLIST_STEPS } from '../../../../telemetry/checklistEvents';
import { useChecklistTracking } from '../../../../telemetry/useChecklistTracking';
import { useMailOnboardingTelemetry } from '../../useMailOnboardingTelemetry';
import { ONLINE_SERVICES } from '../constants';
import UpdateMailAddressModal from './UpdateMailAddressModal';

const UserOnboardingAccountsSwitcher = () => {
    const [addresses] = useAddresses();
    const sortedAddresses = sortAddresses(addresses || []);
    const updateMailAddressModal = useModalStateObject();
    const { createNotification } = useNotifications();
    const { changeChecklistDisplay, canDisplayChecklist } = useGetStartedChecklist();
    const tracking = useChecklistTracking();
    const sendMailOnboardingTelemetry = useMailOnboardingTelemetry();

    useEffect(() => {
        tracking.trackStepLoaded(CHECKLIST_STEPS.accountsScreen);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- the tracking functions are recreated on every render
    }, []);

    if (!canDisplayChecklist) {
        return null;
    }

    const handleChangeChecklistDisplay = () => {
        tracking.trackStepInteracted(CHECKLIST_STEPS.accountsScreen, CHECKLIST_ACTIONS.skip);
        changeChecklistDisplay(CHECKLIST_DISPLAY_TYPE.REDUCED, CHECKLIST_REDUCE_TRIGGERS.user);
        void sendMailOnboardingTelemetry(OldTelemetryMailOnboardingEvents.finish_change_login, {});
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
                        .t`Protect your accounts`}</h1>
                    <p className="color-weak m-0 mb-4">
                        {c('Onboarding List Placeholder')
                            .t`Switch the services you use every day to your ${BRAND_NAME} address for better security and privacy.`}
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
                                    tracking.trackStepInteracted(
                                        CHECKLIST_STEPS.accountsScreen,
                                        CHECKLIST_ACTIONS.copyAddress
                                    );
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
                <p className="text-sm color-weak text-center">{c('Onboarding List Placeholder')
                    .t`Some popular services`}</p>
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
                                    tracking.trackServiceSelected(service.key);
                                    void sendMailOnboardingTelemetry(OldTelemetryMailOnboardingEvents.change_login, {
                                        service: service.key,
                                    });
                                }}
                                className="inline-flex items-center justify-center rounded-lg shrink-0 gap-2"
                                data-testid={`ServiceButton:${service.key}`}
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
