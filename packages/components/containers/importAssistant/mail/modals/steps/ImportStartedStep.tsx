import React from 'react';
import { c } from 'ttag';

import { Address } from 'proton-shared/lib/interfaces';

import importStartedSvg from 'design-system/assets/img/onboarding/import-assistant.svg';

import { ImportMailModalModel } from '../../interfaces';

interface Props {
    modalModel: ImportMailModalModel;
    addresses: Address[];
}

const ImportStartedStep = ({ modalModel, addresses }: Props) => {
    const address = addresses.find((addr) => addr.ID === modalModel.payload.AddressID);

    return (
        <div className="text-center">
            <img src={importStartedSvg} alt="" className="max-w80" />
            <h3>{c('Info').t`Your import has started!`}</h3>
            <div className="mt1">{c('Info').t`Your messages are being imported from`}</div>
            <div className="mt1">
                <strong>{modalModel.email}</strong>
            </div>
            <div>{c('Info').t`to`}</div>
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
