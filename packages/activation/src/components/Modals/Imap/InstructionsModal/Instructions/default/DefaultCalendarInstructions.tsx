import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { IMPORT_CALENDAR_FAQ_URL } from '@proton/shared/lib/calendar/constants';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

const DefaultCalendarInstructions = () => {
    // translator: full sentence: "To import a calendar to Proton, you need the ICS file. Download this before you start the import process."
    const knowledgeBaseLink = (
        <Href href={getKnowledgeBaseUrl(IMPORT_CALENDAR_FAQ_URL)} key="knowledgeBaseLink">
            {c('Import instructions link').t`ICS file`}
        </Href>
    );
    // translator: full sentence: "To import a calendar to Proton, you need the ICS file. Download this before you start the import process."
    const defaultCalendarMessage = c('Import instructions')
        .jt`To import a calendar to ${BRAND_NAME}, you need the ${knowledgeBaseLink}. Download this before you start the import process.`;

    return (
        <div className="mb-4" data-testid="Instruction:defaultCalendarInstructions">
            {defaultCalendarMessage}
        </div>
    );
};

export default DefaultCalendarInstructions;
