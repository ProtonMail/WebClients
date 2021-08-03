import { c } from 'ttag';

import { Address } from '@proton/shared/lib/interfaces';

import importStartedSvg from '@proton/styles/assets/img/onboarding/import-assistant.svg';

import { ImportMailModalModel } from '../../interfaces';

interface Props {
    modalModel: ImportMailModalModel;
    addresses: Address[];
}

const ImportStartedStep = ({ modalModel, addresses }: Props) => {
    const address = addresses.find((addr) => addr.ID === modalModel.payload.AddressID);

    // translator: this is part of a sentence that needed to be cut in the code to respect the design. The full sentence is the following: "Your messages are being imported from ${email1} to ${email2}", where ${email1} and ${email2} are variables.
    const sentenceFragment1 = c('Info').t`Your messages are being imported from`;
    // translator: this is part of a sentence that needed to be cut in the code to respect the design. The full sentence is the following: "Your messages are being imported from ${email1} to ${email2}", where ${email1} and ${email2} are variables.
    const sentenceFragment2 = c('Info').t`to`;

    return (
        <div className="text-center">
            <img src={importStartedSvg} alt="" className="max-w80" />
            <h3>{c('Info').t`Your import has started!`}</h3>
            <div className="mt1">{sentenceFragment1}</div>
            <div className="mt1">
                <strong>{modalModel.email}</strong>
            </div>
            <div>{sentenceFragment2}</div>
            <div>
                <strong>{address?.Email}</strong>
            </div>
            <div className="mt1">{c('Info').t`We will notify you once your import is finished.`}</div>
            <div>{c('Info').t`Large imports can take several days to complete.`}</div>
            <div className="mt1">{c('Info').t`You can continue using Proton services as usual.`}</div>
        </div>
    );
};

export default ImportStartedStep;
