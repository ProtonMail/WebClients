import type { ChangeEvent, FormEvent } from 'react';
import { useSelector } from 'react-redux';
import { Redirect, useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { IcEnvelope } from '@proton/icons/icons/IcEnvelope';
import { IcGlobe } from '@proton/icons/icons/IcGlobe';
import { IcKey } from '@proton/icons/icons/IcKey';
import { ItemIcon } from '@proton/pass/components/Layout/Icon/ItemIcon';
import { Layout } from '@proton/pass/components/Onboarding/Layout/Layout';
import { Card } from '@proton/pass/components/Onboarding/UI/Card';
import { OnboardingButton } from '@proton/pass/components/Onboarding/UI/OnboardingButton';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { itemCreate } from '@proton/pass/store/actions';
import { selectUser } from '@proton/pass/store/selectors';

import { useCreateContext } from './CreateProvider';
import { Header } from './Header';

import './CreatePassword.scss';

export const CreatePassword = () => {
    const history = useHistory();
    const { service, password, setState, createLogin } = useCreateContext();
    const user = useSelector(selectUser);

    const { dispatch: createItem, loading } = useRequest(itemCreate, {
        onSuccess: () => {
            setState((state) => ({ ...state, password: '' }));
            history.push('/create/report');
        },
    });

    // No service, go back
    if (!service) return <Redirect to="/create" />;

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setState((state) => ({ ...state, password: event.target.value }));
    };

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        const createIntent = createLogin();
        if (createIntent) createItem(createIntent);
    };

    const isValid = () => !!user?.Email && !!password;

    return (
        <Layout>
            <form className="flex flex-column w-full lg:w-2/3 items-center gap-4" onSubmit={handleSubmit}>
                <Header title={c('Title').t`Fill in your details`} />
                <div className="flex flex-row w-1/2 gap-4 items-center justify-center pt-4">
                    <ItemIcon alt="" icon={IcGlobe} url={service.urls[0]} size={6} loadImage />
                    <span className="flex-1 text-xl">{service.title}</span>
                    <OnboardingButton variant="outline" as="a" href="#/create" shape="outline" size="large">
                        {c('Action').t`Change`}
                    </OnboardingButton>
                </div>
                <Card className="p-4 flex flex-row w-1/2 items-center justify-center gap-4 color-weak rounded-xl">
                    <IcEnvelope size={5} />
                    <div className="flex-1 flex flex-column">
                        <span>{c('Label').t`Email`}</span>
                        <span className="color-norm text-lg">{user?.Email}</span>
                    </div>
                </Card>
                {/* Password deliberately rendered as plain text: this is a creation step, the user
                    should see what they type before saving it to Pass */}
                <label className="onboarding-password-input p-4 flex flex-row w-1/2 gap-2 items-center justify-center color-weak rounded-xl">
                    <IcKey size={5} />
                    <div className="flex-1 flex flex-column">
                        <span className="px-2">{c('Label').t`Password`}</span>
                        <input
                            className="field color-norm text-lg"
                            value={password}
                            onChange={handleChange}
                            name="password"
                            autoComplete="off"
                            autoCapitalize="off"
                            autoCorrect="off"
                            spellCheck={false}
                        />
                    </div>
                </label>
                <OnboardingButton
                    type="submit"
                    color="norm"
                    fullWidth
                    size="large"
                    className="w-1/2"
                    disabled={!isValid()}
                    loading={loading}
                >
                    {c('Action').t`Create login`}
                </OnboardingButton>
            </form>
        </Layout>
    );
};
