import React from 'react';
import { c } from 'ttag';

import { useModals } from '../../hooks';
import { PrimaryButton, Alert } from '../../components';

import ImportMailModal from './modals/ImportMailModal';

const StartImportSection = () => {
    const { createModal } = useModals();

    const handleClick = () => createModal(<ImportMailModal />);

    return (
        <>
            <Alert learnMore="https://protonmail.com/support/knowledge-base/import-assistant/">
                {c('Info')
                    .t`Transfer your data safely to Proton. Import Assistant connects to your external email provider and imports your selected messages and folders.`}
            </Alert>
            <PrimaryButton className="mt0-5" onClick={handleClick}>{c('Action').t`Start import`}</PrimaryButton>
        </>
    );
};

export default StartImportSection;
