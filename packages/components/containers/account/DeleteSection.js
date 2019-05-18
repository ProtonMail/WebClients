import React from 'react';
import { c } from 'ttag';
import {
    SubTitle,
    Label,
    Row,
    Field,
    MozillaInfoPanel,
    ErrorButton,
    useModals,
    useUser,
    useSubscription
} from 'react-components';

import DeleteAccountModal from './DeleteAccountModal';

const DeleteSection = () => {
    const [{ isMember }] = useUser();
    const [{ isManagedByMozilla }] = useSubscription();
    const { createModal } = useModals();
    // TODO get clientType from config (proton-pack)

    if (isMember) {
        return null;
    }

    if (isManagedByMozilla) {
        return (
            <>
                <SubTitle>{c('Title').t`Delete account`}</SubTitle>
                <MozillaInfoPanel />
            </>
        );
    }

    return (
        <>
            <Row>
                <Label htmlFor="deleteButton">{c('Label').t`Irreversible action`}</Label>
                <Field>
                    <ErrorButton id="deleteButton" onClick={() => createModal(<DeleteAccountModal clientType={1} />)}>
                        {c('Action').t`Delete your account`}
                    </ErrorButton>
                </Field>
            </Row>
        </>
    );
};

export default DeleteSection;
