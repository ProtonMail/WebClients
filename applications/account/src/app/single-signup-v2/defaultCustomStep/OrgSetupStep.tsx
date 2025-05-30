import { useState } from 'react';

import { c } from 'ttag';

import { MAX_CHARS_API } from '@proton/account';
import { Button } from '@proton/atoms';
import { InputFieldTwo, useErrorHandler, useFormErrors } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import Content from '../../public/Content';
import Header from '../../public/Header';
import Main from '../../public/Main';
import Text from '../../public/Text';

interface Props {
    defaultOrgName?: string;
    onSubmit: ({ orgName }: { orgName: string }) => Promise<void>;
}

const OrgSetupStep = ({ defaultOrgName = '', onSubmit }: Props) => {
    const [orgName, setOrgName] = useState(defaultOrgName);
    const [loading, withLoading] = useLoading();
    const { validator, onFormSubmit } = useFormErrors();

    const handleError = useErrorHandler();

    return (
        <Main>
            <Header title={c('Title').t`Set organization name`} />
            <Content>
                <Text>
                    {c('new_plans: signup')
                        .t`The organization name will be visible to your users while they are signed in.`}
                </Text>
                <form
                    name="orgForm"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (!onFormSubmit()) {
                            return;
                        }
                        return withLoading(onSubmit({ orgName }).catch(handleError));
                    }}
                    method="post"
                    autoComplete="off"
                    noValidate
                >
                    <InputFieldTwo
                        id="displayName"
                        bigger
                        label={c('Signup label').t`Organization name`}
                        error={validator([requiredValidator(orgName)])}
                        disableChange={loading}
                        autoFocus
                        value={orgName}
                        onValue={setOrgName}
                        maxLength={MAX_CHARS_API.ORG_NAME}
                    />
                    <Button size="large" color="norm" type="submit" fullWidth loading={loading} className="mt-6">
                        {c('Action').t`Continue`}
                    </Button>
                </form>
            </Content>
        </Main>
    );
};

export default OrgSetupStep;
