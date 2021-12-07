import { c } from 'ttag';

import { Href } from '../../../link';

const DefaultCalendarInstructions = () => {
    // translator: full sentence: "To import a calendar to Proton, you need the ICS file. Download this before you start the import process."
    const knowledgeBaseLink = (
        <Href
            url="https://protonmail.com/support/knowledge-base/import-calendar-to-protoncalendar/"
            key="knowledgeBaseLink"
        >
            {c('Import instructions link').t`ICS file`}
        </Href>
    );
    // translator: full sentence: "To import a calendar to Proton, you need the ICS file. Download this before you start the import process."
    const defaultCalendarMessage = c('Import instructions')
        .jt`To import a calendar to Proton, you need the ${knowledgeBaseLink}. Download this before you start the import process.`;

    return <div className="mb1">{defaultCalendarMessage}</div>;
};

export default DefaultCalendarInstructions;
