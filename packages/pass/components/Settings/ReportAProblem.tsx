import { type FC, useRef } from 'react';
import { useSelector } from 'react-redux';

import type { FormikContextType, FormikErrors } from 'formik';
import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { TextAreaTwo } from '@proton/components';
import { getClientName, getReportInfo } from '@proton/components/helpers/report';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { useActionRequest } from '@proton/pass/hooks/useActionRequest';
import { reportBugIntent } from '@proton/pass/store/actions';
import { selectUser } from '@proton/pass/store/selectors';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import { type BugPayload } from '@proton/shared/lib/api/reports';

import { SettingsPanel } from './SettingsPanel';

type FormValues = { description: string };

const INITIAL_VALUES: FormValues = { description: '' };
const REPORT_TITLE = 'Pass extension bug report';

const validate = ({ description }: FormValues): FormikErrors<FormValues> => {
    const errors: FormikErrors<FormValues> = {};
    if (isEmptyString(description)) errors.description = c('Warning').t`A description of the problem is required`;

    return errors;
};

export const ReportAProblem: FC = () => {
    const { config } = usePassCore();
    const user = useSelector(selectUser);
    const formRef = useRef<FormikContextType<FormValues>>();
    const reportBug = useActionRequest(reportBugIntent, { onSuccess: () => formRef.current?.resetForm() });

    const form = useFormik<FormValues>({
        initialValues: INITIAL_VALUES,
        initialErrors: validate(INITIAL_VALUES),
        validateOnChange: true,
        validateOnMount: true,
        validate,
        onSubmit: async ({ description }) => {
            const payload: BugPayload = {
                ...getReportInfo(),
                Client: getClientName(config.APP_NAME),
                ClientType: config.CLIENT_TYPE,
                ClientVersion: config.APP_VERSION,
                Title: REPORT_TITLE,
                Username: user?.DisplayName || '',
                Email: user?.Email || '',
                Description: description,
            };

            reportBug.dispatch(payload);
        },
    });

    formRef.current = form;

    return (
        <SettingsPanel
            title={c('Label').t`Report a problem`}
            subTitle={c('Warning')
                .t`Reports are not end-to-end encrypted, please do not send any sensitive information.`}
        >
            <FormikProvider value={form}>
                <Form>
                    <TextAreaTwo
                        className="mb-4"
                        id="description"
                        onChange={form.handleChange}
                        placeholder={c('Placeholder').t`Please describe the problem and include any error messages`}
                        autoGrow
                        minRows={5}
                        value={form.values.description}
                        disabled={reportBug.loading}
                    />

                    <Button
                        className="mt-4 w-full"
                        pill
                        color="norm"
                        disabled={!form.isValid}
                        loading={reportBug.loading}
                        type="submit"
                    >
                        {reportBug.loading && c('Action').t`Submitting report...`}
                        {!reportBug.loading && c('Action').t`Submit`}
                    </Button>
                </Form>
            </FormikProvider>
        </SettingsPanel>
    );
};
