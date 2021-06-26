import React from 'react';
import { c } from 'ttag';

import { Address } from '@proton/shared/lib/interfaces';

import { Icon, FullLoader, TextLoader } from '../../../../../components';

import { ImportContactsModalModel, IMPORT_ERROR } from '../../interfaces';

interface Props {
    modalModel: ImportContactsModalModel;
    addresses: Address[];
}

const ImportPrepareStep = ({ modalModel, addresses }: Props) => {
    const isLoading = !modalModel.importID;

    if (modalModel.errorCode === IMPORT_ERROR.IMAP_CONNECTION_ERROR) {
        return (
            <div className="p1 text-center w100 color-danger">
                <Icon name="attention" size={60} />
                <div className="mt0-5 mlauto mrauto mb0-5 max-w30e">
                    {c('Error').t`We were unable to connect to your service provider.`}
                    <br />
                    {c('Error').t`Please try to reauthenticate and make sure the permissions are set correctly.`}
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="p1 text-center w100">
                <FullLoader size={100} />
                <TextLoader>{c('Loading info').t`Connecting to your contacts provider`}</TextLoader>
            </div>
        );
    }

    const addressToDisplay = addresses.find((addr) => addr.ID === modalModel.payload.AddressID);

    const fromEmailAddress = <strong>{modalModel.email}</strong>;
    const toEmailAddress = <strong>{addressToDisplay?.Email}</strong>;

    const from = c('Label').jt`From: ${fromEmailAddress}`;
    const to = c('Label').jt`To: ${toEmailAddress}`;

    return (
        <>
            <div className="flex pb1 mb1 border-bottom">
                <div className="flex-item-fluid text-ellipsis mr0-5">{from}</div>
                <div className="flex-item-fluid text-ellipsis ml0-5 text-right">{to}</div>
            </div>

            <div className="pb1 mb1 border-bottom">
                <div className="flex flex-align-items-center">
                    <Icon className="mr0-5" name="contacts" />
                    {c('Info').t`Import contacts`}
                </div>
            </div>
        </>
    );
};

export default ImportPrepareStep;
