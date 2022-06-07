import { useState, FormEvent, useMemo } from 'react';
import { c } from 'ttag';
import { normalize } from '@proton/shared/lib/helpers/string';
import { checkSieveFilter, addTreeFilter, updateFilter } from '@proton/shared/lib/api/filters';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { FILTER_VERSION } from '../../constants';
import { Filter, AdvancedSimpleFilterModalModel, ErrorsSieve } from '../../interfaces';
import { sieveTemplates, convertModel } from '../../utils';

import './AdvancedFilterModal.scss';

import {
    useDebounceInput,
    ModalTwo,
    Form,
    ModalTwoHeader,
    ModalTwoContent,
    ModalTwoFooter,
    useModalState,
    ModalProps,
    Href,
} from '../../../../components';

import {
    useLoading,
    useApi,
    useFilters,
    useActiveBreakpoint,
    useNotifications,
    useEventManager,
    useApiWithoutResult,
    useUserSettings,
} from '../../../../hooks';

import FilterNameForm from '../FilterNameForm';
import FooterAdvancedFilterModal from './FooterAdvancedFilterModal';
import SieveForm from './SieveForm';
import CloseFilterModal from '../CloseFilterModal';

interface Props extends ModalProps {
    filter?: Filter;
}

const checkNameErrors = (name: string, filters: Filter[]): string => {
    if (!name) {
        return c('Error').t`This field is required`;
    }
    if (filters.find(({ Name }: Filter) => normalize(Name) === normalize(name))) {
        return c('Error').t`Filter with this name already exist`;
    }
    return '';
};

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
    const { isNarrow } = useActiveBreakpoint();
    const [loading, withLoading] = useLoading();
    const [filters = []] = useFilters();
    const [userSettings] = useUserSettings();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();

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
    const sieve = useDebounceInput(model.sieve);

    const errors = useMemo<ErrorsSieve>(() => {
        return {
            name: !model.name || model.name !== initialModel.name ? checkNameErrors(model.name, filters) : '',
            sieve: checkSieveErrors(model.sieve, model.issues.length),
        };
    }, [model.name, model.sieve, model.issues]);

    const reqCreate = useApiWithoutResult<{ Filter: Filter }>(addTreeFilter);
    const reqUpdate = useApiWithoutResult<{ Filter: Filter }>(updateFilter);

    const createFilter = async (filter: Filter) => {
        try {
            const { Filter } = await reqCreate.request(filter);
            createNotification({
                text: c('Notification').t`${Filter.Name} created`,
            });
        } finally {
            // Some failed request will add the filter but in disabled mode
            // So we have to refresh the list in both cases
            await call();
            onClose?.();
        }
    };

    const editFilter = async (filter: Filter) => {
        const { Filter } = await reqUpdate.request(filter.ID, filter);
        await call();
        createNotification({
            text: c('Filter notification').t`Filter ${Filter.Name} updated`,
        });
        onClose?.();
    };

    const checkSieve = async () => {
        const { Issues = [] } = await api(checkSieveFilter({ Version: FILTER_VERSION, Sieve: sieve }));

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
        <Href url={getKnowledgeBaseUrl('/sieve-advanced-custom-filters')}>{c('Info')
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
                    <p>
                        {
                            // translator: full sentence is: To work properly, each filter must contain at least a name and a valid Sieve script. You can learn more about Sieve programming language
                            c('Info')
                                .jt`To work properly, each filter must contain at least a name and a valid Sieve script. You can ${link}.`
                        }
                    </p>

                    {/*<HeaderAdvancedFilterModal model={model} errors={errors} onChange={setModel} />*/}
                    <FilterNameForm
                        model={model}
                        onChange={(newModel) => setModel(newModel as AdvancedSimpleFilterModalModel)}
                        isNarrow={isNarrow}
                        errors={errors}
                        loading={loading}
                        isSieveFilter
                    />
                    <SieveForm model={model} onChange={setModel} userSettings={userSettings} />
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
