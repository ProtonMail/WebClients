import { c } from 'ttag';

import yahooAppPasswordImg from '@proton/styles/assets/img/import-instructions/yahoo.png';

const YahooMailImportInstructionsStep = () => {
    const boldAccountInfo = <strong key="boldAccountInfo">{c('Import instructions emphasis').t`Account info`}</strong>;
    const boldAccountSec = (
        <strong key="boldAccountSec">{c('Import instructions emphasis').t`Account security`}</strong>
    );
    const boldAppPassword = (
        <strong key="boldAppPassword">{c('Import instructions emphasis').t`Other ways to sign in`}</strong>
    );

    // translator: the variables here are HTML tags, here is the complete sentence: "Log into Yahoo Mail and click on your name in the upper right corner to access Account info. In the Account security section, scroll to the Other ways to sign in section to generate an app password. You will need this password during the import."
    const yahooAppPasswordMessage = c('Import instructions')
        .jt`Log into Yahoo Mail and click on your name in the upper right corner to access ${boldAccountInfo}. In the ${boldAccountSec} section, scroll to the ${boldAppPassword} section to generate an app password. You will need this password during the import.`;

    return (
        <>
            <div className="mb1">{yahooAppPasswordMessage}</div>
            <img
                className="border--currentColor"
                src={yahooAppPasswordImg}
                alt={c('Import instructions image alternative text').t`How to create an app password in Gmail settings`}
            />
        </>
    );
};

export default YahooMailImportInstructionsStep;
