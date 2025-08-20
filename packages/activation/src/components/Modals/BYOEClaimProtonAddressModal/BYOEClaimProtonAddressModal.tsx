import { type FormEvent, useEffect, useState } from 'react';

import { c } from 'ttag';

import { setupExternalUserForProton } from '@proton/account/addresses/actions';
import useBYOEAddressData from '@proton/activation/src/hooks/useBYOEAddressData';
import { Button } from '@proton/atoms';
import {
    Form,
    InputFieldStacked,
    InputFieldTwo,
    type ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    useApi,
    useAuthentication,
    useErrorHandler,
    useEventManager,
    useFormErrors,
    useNotifications,
} from '@proton/components';
import { useLoading } from '@proton/hooks/index';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { queryCheckUsernameAvailability } from '@proton/shared/lib/api/user';
import { type APP_NAMES, BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import {
    requiredValidator,
    usernameCharacterValidator,
    usernameEndCharacterValidator,
    usernameLengthValidator,
    usernameStartCharacterValidator,
} from '@proton/shared/lib/helpers/formValidators';
import type { CalendarUserSettings, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import claimProtonAddressImg from '@proton/styles/assets/img/illustrations/claim-proton-address.svg';

interface Props extends ModalProps {
    toApp: APP_NAMES;
    title?: string;
    description?: string;
    onCreateCalendar?: () => Promise<{
        calendars: VisualCalendar[];
        calendarUserSettings: CalendarUserSettings;
    }>;
}

const BYOEClaimProtonAddressModal = ({
    toApp,
    title = c('Title').t`Claim your ${MAIL_APP_NAME} address`,
    description = c('Info')
        .t`Ensure fully private and encrypted communication. Claim your free ${BRAND_NAME} email address now.`,
    onClose,
    onCreateCalendar,
    ...rest
}: Props) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const silentApi = getSilentApi(api);
    const { call } = useEventManager();
    const errorHandler = useErrorHandler();
    const authentication = useAuthentication();
    const dispatch = useDispatch();
    const [addressData, loadingAddressData] = useBYOEAddressData();
    const [username, setUsername] = useState('');
    const [loadingSubmit, withLoading] = useLoading();

    const { validator, onFormSubmit } = useFormErrors();

    useEffect(() => {
        if (addressData?.claimableAddress?.username) {
            setUsername(addressData.claimableAddress.username);
        }
    }, [addressData?.claimableAddress?.username]);

    const trimmedUsername = username.trim();
    const domain = addressData?.domains.length ? addressData.domains[0] : undefined;

    const handleCreateProtonAddress = async ({
        username,
        domain,
        onCreateCallback,
        toApp,
    }: {
        username: string;
        domain: string;
        onCreateCallback?: () => void;
        toApp: APP_NAMES;
    }) => {
        try {
            await silentApi(queryCheckUsernameAvailability(`${username}@${domain}`, true));
        } catch (e) {
            errorHandler(e);
            return;
        }

        const payload = {
            username,
            domain,
            address: `${username}@${domain}`,
            setup: {
                mode: 'create',
                keyPassword: authentication.getPassword(),
            } as const,
        };

        try {
            await dispatch(setupExternalUserForProton({ payload, app: toApp }));

            createNotification({
                type: 'success',
                text: c('loc_nightly: BYOE').t`Your ${BRAND_NAME} address is ready to use`,
            });
            onCreateCallback?.();

            // Call the event manager so that we update the get-started checklist items
            void call();
        } catch (e) {
            errorHandler(e);
        }
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (loadingAddressData || !onFormSubmit() || !domain) {
            return;
        }

        await handleCreateProtonAddress({ username, domain, onCreateCallback: () => onClose?.(), toApp });

        // In some cases (e.g. in settings import modal) we also want to create a calendar right away
        if (onCreateCalendar) {
            await onCreateCalendar();
        }
    };

    const suffix = domain && !loadingAddressData ? `@${domain}` : undefined;

    return (
        <ModalTwo as={Form} onSubmit={(e: FormEvent) => withLoading(handleSubmit(e))} onClose={onClose} {...rest}>
            <ModalTwoHeader />
            <ModalTwoContent>
                <div className="text-center mb-4">
                    <img src={claimProtonAddressImg} alt="" />
                </div>
                <h1 className="text-center text-bold text-2xl">{title}</h1>
                <p className="text-center color-weak">{description}</p>

                <InputFieldStacked classname="mb-2">
                    <InputFieldTwo
                        type="text"
                        label={c('Label').t`Username`}
                        className="rounded-none"
                        autoFocus
                        unstyled
                        disabled={loadingAddressData}
                        value={username}
                        onValue={setUsername}
                        suffix={suffix}
                        error={validator([
                            requiredValidator(trimmedUsername),
                            usernameLengthValidator(trimmedUsername),
                            usernameStartCharacterValidator(trimmedUsername),
                            usernameEndCharacterValidator(trimmedUsername),
                            usernameCharacterValidator(trimmedUsername),
                        ])}
                    />
                </InputFieldStacked>
            </ModalTwoContent>
            <ModalTwoFooter className="flex-column">
                <Button
                    color="norm"
                    disabled={loadingAddressData || loadingSubmit}
                    type="submit"
                    loading={loadingSubmit}
                >
                    {c('Action').t`Claim this address`}
                </Button>
                <Button shape="outline" onClick={() => onClose?.()}>
                    {c('Action').t`Cancel`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default BYOEClaimProtonAddressModal;
