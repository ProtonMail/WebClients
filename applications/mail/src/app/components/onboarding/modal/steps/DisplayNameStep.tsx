import { useState } from 'react';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader ';
import {
    InputFieldTwo,
    OnboardingStep,
    type OnboardingStepRenderCallback,
    useApi,
    useFormErrors,
} from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { updateAddress } from '@proton/shared/lib/api/addresses';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import type { Address } from '@proton/shared/lib/interfaces';
import { getLocalPart } from '@proton/shared/lib/keys';
import displayNameImage from '@proton/styles/assets/img/onboarding/img-display-name.svg';

import type { OnboardingStepEligibleCallback } from '../interface';
import OnboardingContent from '../layout/OnboardingContent';

export const isDisplayNameStepEligible: OnboardingStepEligibleCallback = async () => ({
    canDisplay: new URLSearchParams(window.location.search).get('partner') === 'true',
    preload: [displayNameImage],
});

const DisplayNameStep = ({ onNext }: OnboardingStepRenderCallback) => {
    const [displayName, setDisplayName] = useState<string | null>(null);
    const [addresses] = useAddresses();
    const description = c('Onboarding modal')
        .t`To get started, choose a display name. This is what people will see when you send an email, invite them to an event, or share a file.`;
    const { validator, onFormSubmit } = useFormErrors();
    const [loadingSubmit, withLoading] = useLoading();
    const api = useApi();

    const onSubmit = async ({ address, displayName }: { address: Address; displayName: string }) => {
        await api(
            updateAddress(address.ID, {
                DisplayName: displayName,
                Signature: address.Signature,
            })
        );
        onNext();
    };

    const firstAddress = addresses?.[0];
    const defaultValue = firstAddress ? firstAddress.DisplayName || getLocalPart(firstAddress.Email) : '';

    const value = displayName === null ? defaultValue : displayName;
    const loadingDependencies = !firstAddress;

    return (
        <OnboardingStep>
            <form
                name="accountForm"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (!firstAddress || !onFormSubmit()) {
                        return;
                    }
                    return withLoading(onSubmit({ address: firstAddress, displayName: value }));
                }}
                method="post"
                autoComplete="off"
                noValidate
            >
                <OnboardingContent
                    topChildren={
                        <div className="text-center mt-4">
                            <img src={displayNameImage} alt="" />
                        </div>
                    }
                    title={c('Onboarding modal').t`Set a display name`}
                    description={description}
                    className="mb-16 h-custom flex flex-column items-center justify-center items-stretch"
                    style={{ '--h-custom': '25.625rem' }}
                    titleBlockClassName="mb-4"
                >
                    <InputFieldTwo
                        id="displayName"
                        label={c('Signup label').t`Display name`}
                        error={validator([requiredValidator(value)])}
                        disableChange={loadingSubmit || loadingDependencies}
                        autoFocus
                        value={value}
                        onValue={setDisplayName}
                        suffix={loadingDependencies ? <CircleLoader /> : null}
                    />
                </OnboardingContent>
                <footer>
                    <Button size="large" color="norm" fullWidth type="submit">
                        {c('Onboarding modal').t`Continue`}
                    </Button>
                </footer>
            </form>
        </OnboardingStep>
    );
};

export default DisplayNameStep;
