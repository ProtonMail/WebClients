import { c } from 'ttag';

const DefaultContactsInstructions = () => {
    const defaultContactsMessage = c('Import instructions')
        .t`To import contacts to Proton, you need a CSV file. Download this before you start the import process.`;

    return <div className="mb1">{defaultContactsMessage}</div>;
};

export default DefaultContactsInstructions;
