import { c } from 'ttag';

import Bordered from '@proton/components/components/container/Bordered';
import Details from '@proton/components/components/container/Details';
import Summary from '@proton/components/components/container/Summary';
import { MAX_UID_CHARS_DISPLAY } from '@proton/shared/lib/calendar/constants';
import type { ImportEventError } from '@proton/shared/lib/calendar/icsSurgery/ImportEventError';
import { truncateMore } from '@proton/shared/lib/helpers/string';

const getComponentText = (component: string) => {
    if (component === 'vevent') {
        return c('Error importing event').t`Event`;
    }
    if (component === 'vcalendar') {
        return c('Error importing event').t`Calendar`;
    }
    if (component === 'vtimezone') {
        return c('Error importing event').t`Time zone`;
    }
    if (component === 'vtodo') {
        return c('Error importing event').t`Element`;
    }
    if (component === 'vjournal') {
        return c('Error importing event').t`Element`;
    }
    if (component === 'vfreebusy') {
        return c('Error importing event').t`Element`;
    }
    if (component === '') {
        return c('Error importing event').t`Bad format. Component cannot be read.`;
    }
    return c('Error importing event').t`Unknown`;
};

const getErrorIdentifierText = (error: ImportEventError) => {
    const shortUID = truncateMore({
        string: error.componentIdentifiers.componentId,
        charsToDisplay: MAX_UID_CHARS_DISPLAY,
    });
    return `${getComponentText(error.componentIdentifiers.component)} ${shortUID}`;
};

const ErrorDetail = ({ error, ...rest }: { error: ImportEventError }) => {
    const errorLabel = `${getErrorIdentifierText(error)}: `;
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
    errors: ImportEventError[];
}

const ErrorDetails = ({ errors, summary = c('Info on errors').t`Click for details` }: Props) => {
    if (!errors.length) {
        return null;
    }

    return (
        <Details>
            <Summary>{summary}</Summary>
            <Bordered className="rounded">
                {errors.map((error, i) => (
                    <ErrorDetail error={error} key={error.componentIdentifiers.componentId + i.toString()} />
                ))}
            </Bordered>
        </Details>
    );
};

export default ErrorDetails;
