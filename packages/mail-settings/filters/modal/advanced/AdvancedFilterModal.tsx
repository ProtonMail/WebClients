import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Href } from '@proton/atoms/Href/Href';
import Form from '@proton/components/components/form/Form';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import useLoading from '@proton/hooks/useLoading';
import { addFilter, updateFilter } from '@proton/mail/store/filters/actions';
import { useFilters } from '@proton/mail/store/filters/hooks';
import { checkSieveFilter } from '@proton/shared/lib/api/filters';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { CreateFilter, Filter } from '@proton/sieve/filterModel';

import { FILTER_VERSION } from '../../constants';
import type { AdvancedSimpleFilterModalModel, ErrorsSieve } from '../../interfaces';
import { useFilterDispatch } from '../../useFilterDispatch';
import { checkNameErrors, convertModel, sieveTemplates } from '../../utils';
import CloseFilterModal from '../CloseFilterModal';
import FilterNameForm from '../FilterNameForm';
import FooterAdvancedFilterModal from './FooterAdvancedFilterModal';
import SieveForm from './SieveForm';

import './AdvancedFilterModal.scss';

interface Props extends ModalProps {
    filter?: Filter;
}

const checkSieveErrors = (sieve: string, issuesLength: number): string => {
    if (!sieve) {
        return c('Error').t`This field is required`;
    }

    if (issuesLength) {
        return c('Error').t`Invalid Sieve code`;
    }
    return '';
};

const AdvancedFilterModal = ({ filter, ...rest }: Props) => {
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const [filters = []] = useFilters();
    const { createNotification } = useNotifications();
    const dispatch = useFilterDispatch();

    const [closeFilterModalProps, setCloseFilterModalOpen] = useModalState();

    const { onClose } = rest;

    const isEdit = !!filter?.ID;
    const title = isEdit ? c('Title').t`Edit Sieve filter` : c('Title').t`Add Sieve filter`;

    const sieveTemplate = sieveTemplates[filter?.Version || FILTER_VERSION];

    const initialModel = {
        id: filter?.ID,
        sieve: filter?.Sieve || sieveTemplate || '',
        name: filter?.Name || '',
        issues: [],
    };

    const [model, setModel] = useState<AdvancedSimpleFilterModalModel>(initialModel);

    const errors = useMemo<ErrorsSieve>(() => {
        return {
            name: checkNameErrors(filters, model.name, initialModel.name),
            sieve: checkSieveErrors(model.sieve, model.issues.length),
        };
    }, [model.name, model.sieve, model.issues]);

    const createFilter = async (filter: CreateFilter) => {
        // On failure, keep the modal open so the typed script isn't lost.
        // If the API still added the filter (in disabled mode), the event loop updates the list.
        const Filter = await dispatch(addFilter({ filter }));
        createNotification({
            text: c('Notification').t`${Filter.Name} created`,
        });
        onClose?.();
    };

    const editFilter = async (filter: CreateFilter) => {
        const Filter = await dispatch(updateFilter({ id: filter.ID, filter }));
        createNotification({
            text: c('Filter notification').t`Filter ${Filter.Name} updated`,
        });
        onClose?.();
    };

    const checkSieve = async () => {
        const { Issues = [] } = await api(checkSieveFilter({ Version: FILTER_VERSION, Sieve: model.sieve }));

        const issues = Issues.length ? Issues : [];

        setModel({
            ...model,
            issues,
        });

        return issues;
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const issues = await checkSieve();

        if (issues.length) {
            return;
        }

        if (isEdit) {
            await editFilter(convertModel(model, true));
            return;
        }

        await createFilter(convertModel(model, true));
    };

    const handleClose = () => {
        if (model.name === initialModel.name && model.sieve === initialModel.sieve) {
            return onClose?.();
        }

        setCloseFilterModalOpen(true);
    };

    // translator: full sentence is: To work properly, each filter must contain at least a name and a valid Sieve script. You can learn more about Sieve programming language
    const link = (
        <Href key="more-info-link" href={getKnowledgeBaseUrl('/sieve-advanced-custom-filters')}>{c('Info')
            .t`learn more about Sieve programming language`}</Href>
    );

    return (
        <>
            <ModalTwo
                as={Form}
                onSubmit={(event: FormEvent<HTMLFormElement>) => withLoading(handleSubmit(event))}
                {...rest}
                onClose={handleClose}
                className="advanced-filter-modal"
            >
                <ModalTwoHeader title={title} />
                <ModalTwoContent>
                    <p className="mb-4">
                        {
                            // translator: full sentence is: To work properly, each filter must contain at least a name and a valid Sieve script. You can learn more about Sieve programming language
                            c('Info')
                                .jt`To work properly, each filter must contain at least a name and a valid Sieve script. You can ${link}.`
                        }
                    </p>

                    <FilterNameForm
                        model={model}
                        onChange={(newModel) => setModel(newModel as AdvancedSimpleFilterModalModel)}
                        errors={errors}
                        loading={loading}
                        isSieveFilter
                    />
                    <SieveForm model={model} onChange={setModel} />
                </ModalTwoContent>
                <ModalTwoFooter>
                    <FooterAdvancedFilterModal errors={errors} onClose={handleClose} loading={loading} />
                </ModalTwoFooter>
            </ModalTwo>
            <CloseFilterModal {...closeFilterModalProps} handleDiscard={onClose} />
        </>
    );
};

export default AdvancedFilterModal;
