import { c } from 'ttag';

import { Bordered, Details, Summary } from '@proton/components';
import type { ImportContactError } from '@proton/shared/lib/contacts/errors/ImportContactError';

const ErrorDetail = ({ error, ...rest }: { error: ImportContactError }) => {
    const { contactId } = error;
    const errorLabel = c('Import contact error').t`Contact ${contactId}: `;
    return (
        <div {...rest} className="mb-1 flex flex-column md:flex-row flex-wrap">
            <span className="inline-block max-w-full text-ellipsis mr-1" title={errorLabel}>
                {errorLabel}
            </span>
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
