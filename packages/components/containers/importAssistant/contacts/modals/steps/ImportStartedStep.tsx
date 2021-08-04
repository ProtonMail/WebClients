import { c } from 'ttag';

import { Address } from '@proton/shared/lib/interfaces';

import { ImportContactsModalModel } from '../../interfaces';

interface Props {
    modalModel: ImportContactsModalModel;
    addresses: Address[];
}

const ImportStartedStep = ({ modalModel, addresses }: Props) => {
    const address = addresses.find((addr) => addr.ID === modalModel.payload.AddressID);

    // translator: this is part of a sentence that needed to be cut in the code to respect the design. The full sentence is the following: "Your contacts are being imported from ${email1} to ${email2}", where ${email1} and ${email2} are variables.
    const sentenceFragment1 = c('Info').t`Your contacts are being imported from`;
    // translator: this is part of a sentence that needed to be cut in the code to respect the design. The full sentence is the following: "Your contacts are being imported from ${email1} to ${email2}", where ${email1} and ${email2} are variables.
    const sentenceFragment2 = c('Info').t`to`;

    return (
        <div className="text-center">
            <h3 className="mb1">{c('Info').t`Your import has started!`}</h3>
            <div className="mb1">{sentenceFragment1}</div>
            <div>
                <strong>{modalModel.email}</strong>
            </div>
            <div>{sentenceFragment2}</div>
            <div className="mb1">
                <strong>{address?.Email}</strong>
            </div>
            <div>{c('Info').t`We will notify you once your import is finished.`}</div>
            <div className="mb1">{c('Info').t`Large imports can take several days to complete.`}</div>
            <div>{c('Info').t`You can continue using Proton services as usual.`}</div>
        </div>
    );
};

export default ImportStartedStep;
