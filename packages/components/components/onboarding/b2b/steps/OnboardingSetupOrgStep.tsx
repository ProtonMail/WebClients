import { type ChangeEvent, type KeyboardEvent, useState } from 'react';

import { c } from 'ttag';

import { MAX_CHARS_API } from '@proton/account/organization';
import { initOrganization } from '@proton/account/organization/actions';
import { Button } from '@proton/atoms';
import InputFieldStacked from '@proton/components/components/inputFieldStacked/InputFieldStacked';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import AuthModal from '@proton/components/containers/password/AuthModal';
import { type AuthModalResult } from '@proton/components/containers/password/interface';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { unlockPasswordChanges } from '@proton/shared/lib/api/user';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import b2bBuildings from '@proton/styles/assets/img/onboarding/b2b/img-b2b-buildings.svg';

interface Props {
    onNextStep: () => void;
    onChangeModalSize: (val: boolean) => void;
}

const OnboardingSetupOrgStep = ({ onNextStep, onChangeModalSize }: Props) => {
    const dispatch = useDispatch();

    // Used to "fake" the display of the next step in a loading state.
    const [loading, setLoading] = useState(false);

    const [orgName, setOrgName] = useState('');
    const [error, setError] = useState('');

    const [authModal, showAuthModal] = useModalTwoPromise<undefined, AuthModalResult>();

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
                            <InputFieldStacked icon="buildings" classname="mb-2">
                                <InputFieldTwo
                                    id="organization-name"
                                    className="rounded-none unstyled"
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
            {authModal((props) => {
                return (
                    <AuthModal
                        {...props}
                        scope="password"
                        config={unlockPasswordChanges()}
                        onCancel={props.onReject}
                        onSuccess={props.onResolve}
                    />
                );
            })}
        </>
    );
};

export default OnboardingSetupOrgStep;
