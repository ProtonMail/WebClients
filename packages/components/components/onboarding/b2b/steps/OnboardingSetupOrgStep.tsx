import { type ChangeEvent, type KeyboardEvent, useState } from 'react';

import { c } from 'ttag';

import { MAX_CHARS_API } from '@proton/account/organization';
import { initOrganization } from '@proton/account/organization/actions';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Banner } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import InputFieldStacked from '@proton/components/components/inputFieldStacked/InputFieldStacked';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import AuthModal from '@proton/components/containers/password/AuthModal';
import type { AuthModalResult } from '@proton/components/containers/password/interface';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import useConfig from '@proton/components/hooks/useConfig';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { unlockPasswordChanges } from '@proton/shared/lib/api/user';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getRequiresAccountAppForTwoFactor } from '@proton/shared/lib/authentication/twoFactor';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import b2bBuildings from '@proton/styles/assets/img/onboarding/b2b/img-b2b-buildings.svg';

interface Props {
    onNextStep: () => void;
    onChangeModalSize: (val: boolean) => void;
}

const OnboardingSetupOrgStep = ({ onNextStep, onChangeModalSize }: Props) => {
    const dispatch = useDispatch();
    const { APP_NAME } = useConfig();
    const authentication = useAuthentication();
    const [userSettings] = useUserSettings();

    // Used to "fake" the display of the next step in a loading state.
    const [loading, setLoading] = useState(false);

    const [orgName, setOrgName] = useState('');
    const [error, setError] = useState('');

    const [authModal, showAuthModal] = useModalTwoPromise<undefined, AuthModalResult>();

    // Org init requires `password` scope re-auth, which forces FIDO2 if the user has it as their
    // only 2FA method. FIDO2 only works on account.proton.me — warn the user upfront so they don't
    // type an org name only to be told they have to switch domains.
    const requiresAccountApp = getRequiresAccountAppForTwoFactor({
        enabled: userSettings?.['2FA']?.Enabled,
        appName: APP_NAME,
        hostname: location.hostname,
    });
    const accountAppHref = getAppHref('/', APPS.PROTONACCOUNT, authentication?.localID);

    const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
        setOrgName(target.value);
        if (error) {
            setError('');
        }
    };

    const handleSubmit = async () => {
        if (error) {
            setError('');
        }

        try {
            await showAuthModal();
            onChangeModalSize(true);
            setLoading(true);
            await dispatch(initOrganization({ name: orgName }));
            onNextStep();
        } catch (err) {
            setError(c('Error').t`Something went wrong. Please try again.`);
        }
        setLoading(false);
        onChangeModalSize(false);
    };

    return (
        <>
            {loading ? (
                <>
                    <ModalTwoHeader
                        title={c('Title').t`Set up your organization`}
                        titleClassName="b2b-onboarding-modal-title text-center mt-4 mb-2"
                        subline={c('Description')
                            .t`Use this guide to get your organization promptly benefiting from ${BRAND_NAME}'s industry-leading encryption and privacy ecosystem.`}
                        sublineClassName="b2b-onboarding-modal-subline text-center text-xl my-3 text-wrap-balance"
                    />
                    <ModalTwoContent>
                        <div className="b2b-onboarding-modal-list is-loading mx-auto pt-4" aria-hidden="true">
                            <div className="flex flex-row flex-nowrap mb-6">
                                <div className="shrink-0 w-1/10">
                                    <span className="b2b-onboarding-modal-loading-element-square w-1/2"></span>
                                </div>

                                <div className="flex-1 mr-4 sm:ml-4 my-auto">
                                    <p className="mt-0 b2b-onboarding-modal-loading-element relative"></p>
                                    <p className="my-2 b2b-onboarding-modal-loading-element relative w-9/10"></p>
                                    <p className="my-2 b2b-onboarding-modal-loading-element relative"></p>
                                    <p className="my-2 b2b-onboarding-modal-loading-element relative w-1/10"></p>
                                </div>
                            </div>

                            <div className="flex flex-row flex-nowrap mb-6">
                                <div className="shrink-0 w-1/10">
                                    <span className="b2b-onboarding-modal-loading-element-square w-1/2"></span>
                                </div>

                                <div className="flex-1 mr-4 sm:ml-4 my-auto">
                                    <p className="mt-0 b2b-onboarding-modal-loading-element relative"></p>
                                    <p className="my-2 b2b-onboarding-modal-loading-element relative w-9/10"></p>
                                    <p className="my-2 b2b-onboarding-modal-loading-element relative"></p>
                                    <p className="my-2 b2b-onboarding-modal-loading-element relative w-1/10"></p>
                                </div>
                            </div>

                            <div className="flex flex-row flex-nowrap mb-6">
                                <div className="shrink-0 w-1/10">
                                    <span className="b2b-onboarding-modal-loading-element-square w-1/2"></span>
                                </div>

                                <div className="flex-1 mr-4 sm:ml-4 my-auto">
                                    <p className="mt-0 b2b-onboarding-modal-loading-element relative"></p>
                                    <p className="my-2 b2b-onboarding-modal-loading-element relative w-9/10"></p>
                                    <p className="my-2 b2b-onboarding-modal-loading-element relative"></p>
                                    <p className="my-2 b2b-onboarding-modal-loading-element relative w-1/10"></p>
                                </div>
                            </div>
                        </div>
                    </ModalTwoContent>
                </>
            ) : (
                <>
                    <ModalTwoHeader
                        title={
                            <div className="text-center w-full">
                                <img src={b2bBuildings} alt="" />{' '}
                                <div className="text-center mt-2">{c('Title')
                                    .t`Welcome to ${BRAND_NAME} for Business`}</div>
                            </div>
                        }
                        titleClassName="text-4xl"
                        subline={c('Description').t`To start, give your organization a name.`}
                        sublineClassName="text-center text-2xl color-weak mt-2"
                        hasClose={false}
                    />
                    <ModalTwoContent>
                        <div className="py-8">
                            {requiresAccountApp && (
                                <Banner
                                    variant="warning"
                                    className="mb-4"
                                    action={
                                        <ButtonLike
                                            as="a"
                                            href={accountAppHref}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {c('Action').t`Continue in ${BRAND_NAME} Account`}
                                        </ButtonLike>
                                    }
                                >
                                    {c('Info')
                                        .t`Setting up your organization requires re-authentication with your security key, which is only available in your ${BRAND_NAME} Account.`}
                                </Banner>
                            )}
                            <InputFieldStacked icon="buildings" classname="mb-2">
                                <InputFieldTwo
                                    id="organization-name"
                                    unstyled
                                    inputClassName="rounded-none"
                                    autoFocus
                                    label={c('Placeholder').t`Organization name`}
                                    placeholder={c('Placeholder').t`Your organization name`}
                                    disabled={loading}
                                    required
                                    value={orgName}
                                    onChange={handleChange}
                                    onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (loading) {
                                                return;
                                            }
                                            void handleSubmit();
                                        }
                                    }}
                                    maxLength={MAX_CHARS_API.ORG_NAME}
                                    error={error}
                                />
                            </InputFieldStacked>

                            <p className="color-weak mt-2">{c('Info')
                                .t`This is a name or nickname for your organization that your users will see. You can change it anytime.`}</p>
                        </div>
                    </ModalTwoContent>
                    <ModalTwoFooter>
                        <Button color="norm" fullWidth onClick={handleSubmit} disabled={orgName === '' || loading}>
                            {c('Action').t`Continue`}
                        </Button>
                    </ModalTwoFooter>
                </>
            )}
            {authModal(({ onResolve, onReject, ...props }) => {
                return (
                    <AuthModal
                        {...props}
                        scope="password"
                        config={unlockPasswordChanges()}
                        onCancel={onReject}
                        onSuccess={onResolve}
                    />
                );
            })}
        </>
    );
};

export default OnboardingSetupOrgStep;
