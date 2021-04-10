import React from 'react';
import { c } from 'ttag';

import { noop } from 'proton-shared/lib/helpers/function';

import importWelcomeSvg from 'design-system/assets/img/onboarding/import-assistant.svg';

import { FormModal, Href, Button } from '../../../../components';

interface Props {
    onClose?: () => void;
}

const ImportWelcomeModal = ({ onClose = noop, ...rest }: Props) => {
    const gmailLink = (
        <Href
            url="https://protonmail.com/support/knowledge-base/transitioning-from-gmail-to-protonmail/"
            key="gmailLink"
        >
            Gmail
        </Href>
    );
    const yahooLink = (
        <Href url="https://protonmail.com/support/knowledge-base/migrate-from-yahoo-to-protonmail/" key="yahooLink">
            Yahoo
        </Href>
    );
    const outlookLink = (
        <Href url="https://protonmail.com/support/knowledge-base/migrate-from-outlook-to-protonmail/" key="outlookLink">
            Outlook
        </Href>
    );

    // translator: the variables here are HTML tags, here is the complete sentence: "Our guides for Gmail, Yahoo, and Outlook show you the next steps as you switch to Proton."
    const bottomMessage = c('Info')
        .jt`Our guides for ${gmailLink}, ${yahooLink}, and ${outlookLink} show you the next steps as you switch to Proton.`;

    return (
        <FormModal
            title={
                <h1 className="modal-title text-center">{c('Title').t`Your smooth transition to digital privacy`}</h1>
            }
            submit={
                <Button color="norm" type="submit" data-focus-fallback={1}>
                    {c('Action').t`Try Import Assistant`}
                </Button>
            }
            close={null}
            onSubmit={onClose}
            onClose={onClose}
            {...rest}
        >
            <div className="text-center">
                <div className="mt1 mb1">{c('Info')
                    .t`Shelter your data behind Proton encryption with our email transfer feature Import Assistant.`}</div>
                <img src={importWelcomeSvg} alt="" className="mb1" />
                <div className="mb1">{bottomMessage}</div>
            </div>
        </FormModal>
    );
};

export default ImportWelcomeModal;
