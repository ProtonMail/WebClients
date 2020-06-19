import React from 'react';
import { c } from 'ttag';
import { Bordered, Details, Summary } from 'react-components';
import { truncateMore } from 'proton-shared/lib/helpers/string';
import { ImportEventError } from './ImportEventError';
import { MAX_UID_CHARS_DISPLAY } from '../../constants';

const getComponentText = (component: string) => {
    if (component === '') {
        return c('Error importing event').t`Bad format. Component cannot be read.`;
    }
    if (component === 'vcalendar') {
        return c('Error importing event').t`Calendar`;
    }
    if (component === 'vtimezone') {
        return c('Error importing event').t`Timezone`;
    }
    if (component === 'vtodo') {
        return c('Error importing event').t`Todo`;
    }
    if (component === 'vevent') {
        return c('Error importing event').t`Event`;
    }
    if (component === 'vjournal') {
        return c('Error importing event').t`Journal`;
    }
    if (component === 'vfreebusy') {
        return c('Error importing event').t`Free-busy`;
    }
    if (component === 'vevent') {
        return c('Error importing event').t`Event`;
    }
    return c('Error importing event').t`Unknown`;
};

const getErrorIdentifierText = (error: ImportEventError) => {
    const halfUidCharsToDisplay = Math.floor((MAX_UID_CHARS_DISPLAY - 3) / 2);
    const shortUID = truncateMore({
        string: error.componentId,
        charsToDisplayStart: halfUidCharsToDisplay,
        charsToDisplayEnd: halfUidCharsToDisplay,
    });
    return `${getComponentText(error.component)} ${shortUID}`;
};

const ErrorDetail = ({ error, ...rest }: { error: ImportEventError }) => {
    return (
        <div {...rest}>
            <span>{`${getErrorIdentifierText(error)}: `}</span>
            <span className="color-global-warning">{error.message}</span>
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
            <Bordered>
                {errors.map((error, i) => (
                    <ErrorDetail error={error} key={error.componentId + i.toString()} />
                ))}
            </Bordered>
        </Details>
    );
};

export default ErrorDetails;
