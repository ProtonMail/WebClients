import { type VFC, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Form, FormikErrors, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button, Card } from '@proton/atoms';
import { TextAreaTwo } from '@proton/components/components';
import AttachScreenshot, { type Screenshot } from '@proton/components/containers/support/AttachScreenshot';
import { getClientName, getReportInfo } from '@proton/components/helpers/report';
import { reportProblemIntent, selectRequestInFlight, selectUser } from '@proton/pass/store';
import { reportProblem } from '@proton/pass/store/actions/requests';
import { isEmptyString } from '@proton/pass/utils/string';
import { type BugPayload } from '@proton/shared/lib/api/reports';

import { APP_NAME, APP_VERSION, CLIENT_TYPE } from '../../../app/config';

type FormValues = {
    description: string;
};

const REPORT_TITLE = 'Pass extension bug report';

const INITIAL_VALUES: FormValues = {
    description: '',
};

const validate = ({ description }: FormValues): FormikErrors<FormValues> => {
    const errors: FormikErrors<FormValues> = {};

    if (isEmptyString(description)) {
        errors.description = c('Warning').t`A description of the problem is required`;
    }

    return errors;
};

export const ReportAProblem: VFC = () => {
    const dispatch = useDispatch();
    const user = useSelector(selectUser);
    const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
    const [uploadingScreenshots, setUploadingScreenshots] = useState(false);
    const requestInFlight = useSelector(selectRequestInFlight(reportProblem()));

    const form = useFormik<FormValues>({
        initialValues: INITIAL_VALUES,
        initialErrors: validate(INITIAL_VALUES),
        validateOnChange: true,
        validateOnMount: true,
        validate,
        onSubmit: async ({ description }, helpers) => {
            const screenshotBlobs = screenshots.reduce((acc: { [key: string]: Blob }, { name, blob }) => {
                acc[name] = blob;
                return acc;
            }, {});

            const payload: BugPayload = {
                ...getReportInfo(),
                ...screenshotBlobs,
                Client: getClientName(APP_NAME),
                ClientType: CLIENT_TYPE,
                ClientVersion: APP_VERSION,
                Title: REPORT_TITLE,
                Username: user?.DisplayName || '',
                Email: user?.Email || '',
                Description: description,
            };

            dispatch(reportProblemIntent(payload));

            helpers.resetForm();
            setScreenshots([]);
        },
    });

    const submitDisabled = !form.isValid || uploadingScreenshots || requestInFlight;

    return (
        <Card rounded className="mb-4 p-3">
            <span className="text-bold block">{c('Label').t`Report a problem`}</span>

            <hr className="my-2 border-weak" />

            <p>{c('Warning').t`Reports are not end-to-end encrypted, please do not send any sensitive information.`}</p>

            <FormikProvider value={form}>
                <Form>
                    <TextAreaTwo
                        className="mb-4"
                        id="description"
                        onChange={form.handleChange}
                        placeholder={c('Placeholder').t`Please describe the problem and include any error messages`}
                        rows={5}
                        value={form.values.description}
                    />
                    <AttachScreenshot
                        className="mb-4"
                        id="attachments"
                        screenshots={screenshots}
                        setScreenshots={setScreenshots}
                        uploading={uploadingScreenshots}
                        setUploading={setUploadingScreenshots}
                    />
                    <Button
                        className="w100"
                        color="norm"
                        disabled={submitDisabled}
                        loading={requestInFlight}
                        type="submit"
                    >
                        {c('Action').t`Submit`}
                    </Button>
                </Form>
            </FormikProvider>
        </Card>
    );
};
