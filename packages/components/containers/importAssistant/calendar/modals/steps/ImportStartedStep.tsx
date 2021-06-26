import React from 'react';
import { c } from 'ttag';

import { Address } from 'proton-shared/lib/interfaces';

import { ImportCalendarModalModel } from '../../interfaces';

interface Props {
    modalModel: ImportCalendarModalModel;
    addresses: Address[];
}

const ImportStartedStep = ({ modalModel, addresses }: Props) => {
    const address = addresses.find((addr) => addr.ID === modalModel.payload.AddressID);

    return (
        <div className="text-center">
            <h3 className="mb1">{c('Info').t`Your import has started!`}</h3>
            <div className="mb1">{c('Info').t`Your events are being imported from`}</div>
            <div>
                <strong>{modalModel.email}</strong>
            </div>
            <div>{c('Info').t`to`}</div>
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
