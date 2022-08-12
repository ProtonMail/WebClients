import { c } from 'ttag';

import { ImportContactError } from '@proton/shared/lib/contacts/errors/ImportContactError';

import { Bordered, Details, Summary } from '../../../../components';

const ErrorDetail = ({ error, ...rest }: { error: ImportContactError }) => {
    const { contactId } = error;
    return (
        <div {...rest}>
            <span>{c('Import contact error').t`Contact ${contactId}: `}</span>
            <span className="color-danger">{error.message}</span>
        </div>
    );
};

interface Props {
    summary?: string;
    errors: ImportContactError[];
}

const ContactImportWarningErrorDetails = ({ errors, summary = c('Info on errors').t`Click for details` }: Props) => {
    if (!errors.length) {
        return null;
    }
    return (
        <Details>
            <Summary>{summary}</Summary>
            <Bordered className="rounded">
                {errors.map((error, i) => (
                    <ErrorDetail error={error} key={error.contactId + i.toString()} />
                ))}
            </Bordered>
        </Details>
    );
};

export default ContactImportWarningErrorDetails;
