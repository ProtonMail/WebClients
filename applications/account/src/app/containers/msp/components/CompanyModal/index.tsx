import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';

import type { CompanyFormData, MspCompany } from '../../types';
import GeneralSettings from './GeneralSettings';
import { CompanyModalProvider, useCompanyModalContext } from './context';

import '../MspCompaniesSection.scss';

interface Props {
    mode: 'add' | 'edit';
    initial?: MspCompany;
    onSave: (data: CompanyFormData) => Promise<void>;
    onClose: () => void;
}

const CompanyModalContent = ({ onClose }: { onClose: () => void }) => {
    const { isEditing, name, isSubmitting, handleSubmit } = useCompanyModalContext();

    const title = isEditing ? c('Title').t`Edit company` : c('Title').t`Add company`;

    return (
        <ModalTwo open onClose={onClose}>
            <ModalTwoHeader title={title} />
            <ModalTwoContent>
                <GeneralSettings />
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose} disabled={isSubmitting}>{c('Action').t`Cancel`}</Button>
                <Button
                    color="norm"
                    onClick={handleSubmit}
                    loading={isSubmitting}
                    disabled={isSubmitting || !name.trim()}
                >
                    {isEditing ? c('Action').t`Save` : c('Action').t`Add`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

const CompanyModal = ({ mode, initial, onSave, onClose }: Props) => (
    <CompanyModalProvider mode={mode} initial={initial} onSave={onSave}>
        <CompanyModalContent onClose={onClose} />
    </CompanyModalProvider>
);

export default CompanyModal;
