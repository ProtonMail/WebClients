import type { ReactNode } from 'react';
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
    planTitle?: string;
    onSubmit: ({ displayName }: { displayName: string }) => Promise<void>;
    description?: ReactNode;
}

const CongratulationsStep = ({ defaultName = '', planTitle: maybePlanTitle, onSubmit, description }: Props) => {
    const { APP_NAME } = useConfig();
    const [displayName, setDisplayName] = useState(defaultName);
    const [loading, withLoading] = useLoading();
    const { validator, onFormSubmit } = useFormErrors();
    const planTitleElement = maybePlanTitle && <b key="plan-name">{maybePlanTitle}</b>;

    useEffect(() => {
        void metrics.core_signup_pageLoad_total.increment({
            step: 'congratulations',
            application: getSignupApplication(APP_NAME),
        });
    }, []);

    return (
        <Main>
            <Header title={c('Title').t`Set a display name`} />
            <Content>
                {planTitleElement ? (
                    <Text margin="small">{c('new_plans: signup')
                        .jt`Your ${planTitleElement} subscription is now active.`}</Text>
                ) : null}
                <Text>
                    {description ||
                        c('new_plans: signup')
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
                        {c('pass_signup_2023: Action').t`Continue`}
                    </Button>
                </form>
            </Content>
        </Main>
    );
};

export default CongratulationsStep;
