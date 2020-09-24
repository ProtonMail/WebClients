import React from 'react';
import { c } from 'ttag';

import { useModals } from '../../hooks';
import { PrimaryButton, Alert } from '../../components';

import ImportMailModal from './modals/ImportMailModal';

interface Props {
    fetchCurrentImports: () => void;
}

const StartImportSection = ({ fetchCurrentImports }: Props) => {
    const { createModal } = useModals();

    const handleClick = () => createModal(<ImportMailModal onImportComplete={fetchCurrentImports} />);

    return (
        <>
            <Alert learnMore="https://protonmail.com/support/knowledge-base/">
                {c('Info')
                    .t`Proton's Import assistant allows you to easily and securely transfer your messages and folders from another email service into your Proton account.`}
                <br />
                {c('Info')
                    .t`Simply connect to your previous account, decide what you would like to import, and you're done.`}
            </Alert>
            <PrimaryButton className="mt0-5" onClick={handleClick}>{c('Action').t`Start import`}</PrimaryButton>
        </>
    );
};

export default StartImportSection;
