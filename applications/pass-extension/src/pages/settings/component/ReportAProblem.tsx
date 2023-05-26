import { type VFC } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { FormikErrors } from 'formik';
import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button, Card } from '@proton/atoms';
import { TextAreaTwo } from '@proton/components/components';
import { getClientName, getReportInfo } from '@proton/components/helpers/report';
import { reportProblemIntent, selectRequestInFlight, selectUser } from '@proton/pass/store';
import { reportProblem } from '@proton/pass/store/actions/requests';
import { isEmptyString } from '@proton/pass/utils/string';
import { type BugPayload } from '@proton/shared/lib/api/reports';

import { APP_NAME, APP_VERSION, CLIENT_TYPE } from '../../../app/config';
import { useRequestStatusEffect } from '../../../shared/hooks/useRequestStatusEffect';

type FormValues = { description: string };

const INITIAL_VALUES: FormValues = { description: '' };
const REPORT_TITLE = 'Pass extension bug report';

const validate = ({ description }: FormValues): FormikErrors<FormValues> => {
    const errors: FormikErrors<FormValues> = {};

    if (isEmptyString(description)) {
        errors.description = c('Warning').t`A description of the problem is required`;
    }

    return errors;
};

{
    /* FIXME - add screenshots and test upload to Zendesk */
}
export const ReportAProblem: VFC = () => {
    const dispatch = useDispatch();
    const user = useSelector(selectUser);

    // const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
    // const [uploadingScreenshots, setUploadingScreenshots] = useState(false);
    const requestInFlight = useSelector(selectRequestInFlight(reportProblem));

    const form = useFormik<FormValues>({
        initialValues: INITIAL_VALUES,
        initialErrors: validate(INITIAL_VALUES),
        validateOnChange: true,
        validateOnMount: true,
        validate,
        onSubmit: async ({ description }) => {
            // const screenshotBlobs = screenshots.reduce((acc: { [key: string]: Blob }, { name, blob }) => {
            //     acc[name] = blob;
            //     return acc;
            // }, {});

            const payload: BugPayload = {
                ...getReportInfo(),
                Client: getClientName(APP_NAME),
                ClientType: CLIENT_TYPE,
                ClientVersion: APP_VERSION,
                Title: REPORT_TITLE,
                Username: user?.DisplayName || '',
                Email: user?.Email || '',
                Description: description,
            };

            dispatch(reportProblemIntent(payload));
        },
    });

    useRequestStatusEffect(reportProblem, {
        onSuccess: () => {
            form.resetForm();
            // setScreenshots([]);
        },
    });

    return (
        <Card rounded className="mb-4 p-3">
            <strong className="color-norm block mb-1">{c('Label').t`Report a problem`}</strong>
            <em className="block text-sm color-weak mb-2">
                {c('Warning').t`Reports are not end-to-end encrypted, please do not send any sensitive information.`}{' '}
            </em>

            <hr className="mt-2 mb-4 border-weak" />

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
                        disabled={requestInFlight}
                    />

                    {/* <AttachScreenshot
                        id="attachments"
                        screenshots={screenshots}
                        setScreenshots={setScreenshots}
                        uploading={uploadingScreenshots}
                        setUploading={setUploadingScreenshots}
                        disabled={uploadingScreenshots || requestInFlight}
                    /> */}

                    <Button
                        className="mt-4 w100"
                        color="norm"
                        disabled={!form.isValid}
                        loading={requestInFlight}
                        type="submit"
                    >
                        {requestInFlight && c('Action').t`Submitting report...`}
                        {!requestInFlight && c('Action').t`Submit`}
                    </Button>
                </Form>
            </FormikProvider>
        </Card>
    );
};
