import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { useFlag } from '@proton/unleash/useFlag';

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

const getTitle = (isEditing: boolean, isMspV2: boolean) => {
    if (isEditing) {
        return c('Title').t`Edit company`;
    }
    return isMspV2 ? c('Title').t`Add new company` : c('Title').t`Add company`;
};

const CompanyModalContent = ({ onClose }: { onClose: () => void }) => {
    const { isEditing, name, isSubmitting, handleSubmit } = useCompanyModalContext();
    const isMspV2 = useFlag('MspV2');

    return (
        <ModalTwo open onClose={onClose}>
            <ModalTwoHeader title={getTitle(isEditing, isMspV2)} />
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
                    {isEditing || isMspV2 ? c('Action').t`Save` : c('Action').t`Add`}
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
