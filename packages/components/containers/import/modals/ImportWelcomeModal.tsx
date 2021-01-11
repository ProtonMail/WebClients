import React from 'react';
import { c } from 'ttag';

import { noop } from 'proton-shared/lib/helpers/function';

import importWelcomeSvg from 'design-system/assets/img/shared/import-welcome.svg';

import { FormModal, Href, PrimaryButton } from '../../../components';

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

    return (
        <FormModal
            title={
                <h1 className="pm-modalTitle aligncenter">{c('Title').t`Your smooth transition to digital privacy`}</h1>
            }
            submit={
                <PrimaryButton type="submit" data-focus-fallback={1}>{c('Action')
                    .t`Try Import Assistant`}</PrimaryButton>
            }
            close={null}
            onSubmit={onClose}
            onClose={onClose}
            {...rest}
        >
            <div className="aligncenter">
                <div className="mt1 mb1">{c('Info')
                    .t`Shelter your data behind Proton encryption with our email transfer feature Import Assistant.`}</div>
                <img src={importWelcomeSvg} alt="" className="mb1" />
                <div className="mb1">{c('Info')
                    .jt`Our guides for ${gmailLink}, ${yahooLink}, and ${outlookLink} show you the next steps as you switch to Proton.`}</div>
            </div>
        </FormModal>
    );
};

export default ImportWelcomeModal;
