import React, { useState } from 'react';
import { c } from 'ttag';

import gmailImapFolderImg from 'design-system/assets/img/import-instructions/gmail-folder-imap.jpg';
import gmailImapImg from 'design-system/assets/img/import-instructions/gmail-imap.jpg';
import gmailLessSecureAppsImg from 'design-system/assets/img/import-instructions/gmail-less-secure-apps.jpg';
import gmailAppPasswordImg from 'design-system/assets/img/import-instructions/gmail-2FA.jpg';
import yahooAppPasswordImg from 'design-system/assets/img/import-instructions/yahoo.jpg';

import { Alert, Button, Href, Icon, Tabs } from '../../../../../components';

import { GMAIL_INSTRUCTIONS, PROVIDER_INSTRUCTIONS } from '../../interfaces';

interface Props {
    changeProvider: (provider: PROVIDER_INSTRUCTIONS) => void;
    provider?: PROVIDER_INSTRUCTIONS;
    gmailInstructionsStep: GMAIL_INSTRUCTIONS;
}

const ImportInstructionsStep = ({ changeProvider, provider, gmailInstructionsStep }: Props) => {
    const [tabIndex, setTabIndex] = useState(0);

    /* The following consts are to be used in translations */
    const googleAccountLink = (
        <Href url="https://myaccount.google.com" key="googleAccountLink">
            myaccount.google.com
        </Href>
    );
    const boldSecurity = <strong key="boldSecurity">{c('Import instructions emphasis').t`Security`}</strong>;
    const boldAccess = <strong key="boldAccess">{c('Import instructions emphasis').t`turn on access`}</strong>;
    const boldAppPassword = <strong key="boldAppPassword">{c('Import instructions emphasis').t`app password`}</strong>;

    // translator: the variables here are HTML tags, here is the complete sentence: "Go to myaccount.google.com. In the Security section, turn on access for less secure apps. If you don't see this option, you might have 2-step verification enabled."
    const gmail2StepsInstructions = c('Import instructions')
        .jt`Go to ${googleAccountLink}. In the ${boldSecurity} section, ${boldAccess} for less secure apps. If you don't see this option, you might have 2-step verification enabled.`;

    // translator: the variables here are HTML tags, here is the complete sentence: "Go to myaccount.google.com. In the Security section, create an app passwordif if you don't have one already. You will need this password during the import."
    const gmailAppPasswordInstructions = c('Import instructions')
        .jt`Go to ${googleAccountLink}. In the ${boldSecurity} section, create an ${boldAppPassword} if you don't have one already. You will need this password during the import.`;

    const gmailTabs = [
        {
            title: c('Import instructions tab title').t`2-step verification disabled (default settings)`,
            content: (
                <>
                    <div className="mb1">{gmail2StepsInstructions}</div>
                    <img
                        className="border--currentColor"
                        src={gmailLessSecureAppsImg}
                        alt={c('Import instructions image alternative text')
                            .t`How to turn on access for Less Secure Apps in Gmail settings`}
                    />
                </>
            ),
        },
        {
            title: c('Import instructions tab title').t`2-step verification enabled`,
            content: (
                <>
                    <div className="mb1">{gmailAppPasswordInstructions}</div>
                    <img
                        className="border--currentColor"
                        src={gmailAppPasswordImg}
                        alt={c('Import instructions image alternative text')
                            .t`How to create an app password in Gmail settings`}
                    />
                </>
            ),
        },
    ];
    const handleChangeIndex = (index: number) => setTabIndex(index);

    const renderGmail = () => {
        /* The following consts are to be used in translations */
        const boldGmailSettings = (
            <strong key="boldGmailSettings">{c('Import instructions emphasis').t`Gmail Settings`}</strong>
        );
        const boldForwarding = (
            <strong key="boldForwarding">{c('Import instructions emphasis').t`Forwarding and POP/IMAP`}</strong>
        );
        const boldIMAPAccess = <strong key="boldIMAPAccess">{c('Import instructions emphasis').t`IMAP access`}</strong>;
        const boldLabels = <strong key="boldLabels">{c('Import instructions emphasis').t`Labels`}</strong>;
        const bold2Steps = <strong key="bold2Steps">{c('Import instructions emphasis').t`2-step verification`}</strong>;

        // translator: the variables here are HTML tags, here is the complete sentence: "In your Gmail Settings, go to Forwarding and POP/IMAP and make sure that IMAP access is enabled."
        const gmailImapMessage = c('Import instructions')
            .jt`In your ${boldGmailSettings}, go to ${boldForwarding} and make sure that ${boldIMAPAccess} is enabled.`;

        // translator: the variable here is a HTML tag, here is the complete sentence: "In the Labels section, choose the folders allowed for import into ProtonMail."
        const gmailLabelsMessage = c('Import instructions')
            .jt`In the ${boldLabels} section, choose the folders allowed for import into ProtonMail.`;

        // translator: the variable here is a HTML tag, here is the complete sentence: "Allow ProtonMail access into your Gmail account: choose whether 2-step verification is enabled and follow the steps below."
        const gmail2StepsMessage = c('Import instructions')
            .jt`Allow ProtonMail access into your Gmail account: choose whether ${bold2Steps} is enabled and follow the steps below.`;

        switch (gmailInstructionsStep) {
            case GMAIL_INSTRUCTIONS.IMAP:
                return (
                    <>
                        <div className="mb1">{gmailImapMessage}</div>
                        <img
                            className="border--currentColor"
                            src={gmailImapImg}
                            alt={c('Import instructions image alternative text')
                                .t`How to enable IMAP Forwarding in Gmail settings`}
                        />
                    </>
                );
            case GMAIL_INSTRUCTIONS.LABELS:
                return (
                    <>
                        <div className="mb1">{gmailLabelsMessage}</div>
                        <img
                            className="border--currentColor"
                            src={gmailImapFolderImg}
                            alt={c('Import instructions image alternative text')
                                .t`How to show folders in IMAP in Gmail settings`}
                        />
                    </>
                );
            case GMAIL_INSTRUCTIONS.TWO_STEPS:
                return (
                    <>
                        <div className="mb1">{gmail2StepsMessage}</div>
                        <Tabs tabs={gmailTabs} value={tabIndex} onChange={handleChangeIndex} />
                    </>
                );
            default:
                return null;
        }
    };

    const renderNoProviderChosen = () => {
        return (
            <>
                <Alert className="mb1">
                    {c('Info').t`To prepare your external account for import, please follow the instructions for:`}
                </Alert>

                <div className="mb1">
                    <Button
                        shape="outline"
                        onClick={() => changeProvider(PROVIDER_INSTRUCTIONS.GMAIL)}
                        className="inline-flex flex-align-items-center"
                    >
                        <Icon name="gmail" className="mr0-5" />
                        <span>{c('Provider').t`Gmail`}</span>
                        <Icon name="caret" className="ml0-5 rotateZ-270" />
                    </Button>
                </div>

                <div className="mb1">
                    <Button
                        shape="outline"
                        onClick={() => changeProvider(PROVIDER_INSTRUCTIONS.YAHOO)}
                        className="inline-flex flex-align-items-center"
                    >
                        <Icon name="yahoo" className="mr0-5" />
                        <span>{c('Provider').t`Yahoo Mail`}</span>
                        <Icon
                            name="caret"
                            className="ml0-5"
                            style={{
                                transform: 'rotate(-90deg)',
                            }}
                        />
                    </Button>
                </div>

                <Alert>
                    {c('Info')
                        .t`If you are using a different email provider or your account is already prepared, you can skip to import.`}
                </Alert>
            </>
        );
    };

    const renderYahoo = () => {
        /* The following consts are to be used in translations */
        const boldAccountInfo = (
            <strong key="boldAccountInfo">{c('Import instructions emphasis').t`Account info`}</strong>
        );
        const boldAccountSec = (
            <strong key="boldAccountSec">{c('Import instructions emphasis').t`Account security`}</strong>
        );
        const boldManageAppPass = (
            <strong key="boldManageAppPass">{c('Import instructions emphasis').t`Manage app passwords`}</strong>
        );

        // translator: the variables here are HTML tags, here is the complete sentence: "Log into Yahoo Mail and click on your name in the upper right corner to access Account info. In the Account security section, go to Manage app passwords to generate a password. You will need this password during the import."
        const yahooAppPasswordMessage = c('Import instructions')
            .jt`Log into Yahoo Mail and click on your name in the upper right corner to access ${boldAccountInfo}. In the ${boldAccountSec} section, go to ${boldManageAppPass} to generate a password. You will need this password during the import.`;

        return (
            <>
                <div className="mb1">{yahooAppPasswordMessage}</div>
                <img
                    className="border--currentColor"
                    src={yahooAppPasswordImg}
                    alt={c('Import instructions image alternative text')
                        .t`How to create an app password in Gmail settings`}
                />
            </>
        );
    };

    const renderWithProvider = () => (provider === PROVIDER_INSTRUCTIONS.GMAIL ? renderGmail() : renderYahoo());

    return provider ? renderWithProvider() : renderNoProviderChosen();
};

export default ImportInstructionsStep;
