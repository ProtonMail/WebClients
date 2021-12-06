import { c } from 'ttag';

const DefaultCalendarInstructions = () => {
    const defaultCalendarMessage = c('Import instructions')
        .t`To import a calendar to Proton, you need the ICS file. Download this before you start the import process.`;

    return <div className="mb1">{defaultCalendarMessage}</div>;
};

export default DefaultCalendarInstructions;
