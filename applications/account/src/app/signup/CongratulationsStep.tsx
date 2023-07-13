import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { InputFieldTwo, useConfig, useFormErrors } from '@proton/components';
import { useLoading } from '@proton/hooks';
import metrics from '@proton/metrics';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import Content from '../public/Content';
import Header from '../public/Header';
import Main from '../public/Main';
import Text from '../public/Text';
import { getSignupApplication } from './helper';

interface Props {
    defaultName?: string;
    planName?: string;
    onSubmit: ({ displayName }: { displayName: string }) => Promise<void>;
}

const CongratulationsStep = ({ defaultName = '', planName: maybePlanName, onSubmit }: Props) => {
    const { APP_NAME } = useConfig();
    const [displayName, setDisplayName] = useState(defaultName);
    const [loading, withLoading] = useLoading();
    const { validator, onFormSubmit } = useFormErrors();
    const planName = maybePlanName && <b key="plan-name">{maybePlanName}</b>;

    useEffect(() => {
        void metrics.core_signup_pageLoad_total.increment({
            step: 'congratulations',
            application: getSignupApplication(APP_NAME),
        });
    }, []);

    return (
        <Main>
            <Header title={c('Title').t`Congratulations on choosing privacy!`} />
            <Content>
                {planName ? (
                    <Text margin="small">{c('new_plans: signup')
                        .jt`Your ${planName} subscription is now active.`}</Text>
                ) : null}
                <Text>
                    {c('new_plans: signup')
                        .t`To get started, choose a display name. This is what people will see when you send an email, invite them to an event, or share a file.`}
                </Text>
                <form
                    name="accountForm"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (!onFormSubmit()) {
                            return;
                        }
                        return withLoading(onSubmit({ displayName }));
                    }}
                    method="post"
                    autoComplete="off"
                    noValidate
                >
                    <InputFieldTwo
                        id="displayName"
                        bigger
                        label={c('Signup label').t`Display name`}
                        error={validator([requiredValidator(displayName)])}
                        disableChange={loading}
                        autoFocus
                        value={displayName}
                        onValue={setDisplayName}
                    />
                    <Button size="large" color="norm" type="submit" fullWidth loading={loading} className="mt-6">
                        {c('Action').t`Next`}
                    </Button>
                </form>
            </Content>
        </Main>
    );
};

export default CongratulationsStep;
