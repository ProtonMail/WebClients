import type { FormEvent } from 'react';
import { Suspense, lazy, useMemo, useState } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import Form from '@proton/components/components/form/Form';
import useDebounceInput from '@proton/components/components/input/useDebounceInput';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { useDispatch } from '@proton/components/containers/filters/useDispatch';
import NotificationButton from '@proton/components/containers/notifications/NotificationButton';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { addFilter, updateFilter } from '@proton/mail/store/filters/actions';
import { useFilters } from '@proton/mail/store/filters/hooks';
import { checkSieveFilter } from '@proton/shared/lib/api/filters';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { MailFeatureFlag } from '@proton/unleash/Flags';
import { useFlag } from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { FILTER_VERSION } from '../../constants';
import type { AdvancedSimpleFilterModalModel, CreateFilter, ErrorsSieve, Filter } from '../../interfaces';
import { convertModel, sieveTemplates } from '../../utils';
import CloseFilterModal from '../CloseFilterModal';
import FilterNameForm from '../FilterNameForm';
import FooterAdvancedFilterModal from './FooterAdvancedFilterModal';
import SieveForm from './SieveForm';

import './AdvancedFilterModal.scss';

// Lazy-loaded so the heavy Lumo API client is only pulled in when the assistant is opened,
// keeping it out of the @proton/components module graph for all other consumers.
const SieveLumoAssistant = lazy(() => import('./SieveLumoAssistant'));

interface Props extends ModalProps {
    filter?: Filter;
}

const checkNameErrors = (name: string, filters: Filter[]): string => {
    if (!name || name.trim() === '') {
        return c('Error').t`This field is required`;
    }
    const trimmedName = name.trim();
    if (filters.find(({ Name }: Filter) => Name.trim() === trimmedName)) {
        return c('Error').t`Filter with this name already exists`;
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
    const [loading, withLoading] = useLoading();
    const [filters = []] = useFilters();
    const { createNotification, hideNotification } = useNotifications();
    const dispatch = useDispatch();
    const sieveHelperEnabled = useFlag(MailFeatureFlag.LumoSieveHelper);

    const [closeFilterModalProps, setCloseFilterModalOpen] = useModalState();

    const [helperOpen, setHelperOpen] = useState(false);
    // Once opened, the assistant stays mounted (toggled via CSS) so the chat survives close/reopen
    // within the same modal session.
    const [hasOpenedHelper, setHasOpenedHelper] = useState(false);

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

    const createFilter = async (filter: CreateFilter) => {
        try {
            const Filter = await dispatch(addFilter({ filter }));
            createNotification({
                text: c('Notification').t`${Filter.Name} created`,
            });
        } finally {
            // Some failed request will add the filter but in disabled mode
            // So we have to refresh the list in both cases
            onClose?.();
        }
    };

    const editFilter = async (filter: CreateFilter) => {
        const Filter = await dispatch(updateFilter({ id: filter.ID, filter }));
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

    const handleToggleHelper = () => {
        setHelperOpen((open) => {
            if (!open) {
                setHasOpenedHelper(true);
            }
            return !open;
        });
    };

    // Replace the whole script immediately (no confirmation) and offer an Undo on the notification
    // that restores whatever was in the editor beforehand.
    const handleInsertSieve = (code: string) => {
        const previousSieve = model.sieve;
        setModel({ ...model, sieve: code });

        const notificationId = createNotification({
            text: (
                <>
                    <span>{c('Notification').t`Sieve script inserted`}</span>
                    <NotificationButton
                        onClick={() => {
                            setModel((current) => ({ ...current, sieve: previousSieve }));
                            hideNotification(notificationId);
                        }}
                    >{c('Action').t`Undo`}</NotificationButton>
                </>
            ),
        });
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
                className={clsx('advanced-filter-modal', helperOpen && 'advanced-filter-modal--with-helper')}
            >
                <ModalTwoHeader title={title} />
                <ModalTwoContent>
                    <div className="sieve-lumo-layout">
                        <div className="sieve-lumo-editor-pane">
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
                        </div>
                        {sieveHelperEnabled && hasOpenedHelper && (
                            <div className={clsx('sieve-lumo-pane', !helperOpen && 'hidden')}>
                                <Suspense
                                    fallback={
                                        <div
                                            className="sieve-lumo flex-1 border border-weak rounded-lg"
                                            aria-hidden="true"
                                        />
                                    }
                                >
                                    <SieveLumoAssistant
                                        name={model.name}
                                        sieve={model.sieve}
                                        onInsertSieve={handleInsertSieve}
                                        onClose={() => setHelperOpen(false)}
                                    />
                                </Suspense>
                            </div>
                        )}
                    </div>
                </ModalTwoContent>
                <ModalTwoFooter>
                    <FooterAdvancedFilterModal
                        errors={errors}
                        onClose={handleClose}
                        loading={loading}
                        helperOpen={helperOpen}
                        onToggleHelper={handleToggleHelper}
                    />
                </ModalTwoFooter>
            </ModalTwo>
            <CloseFilterModal {...closeFilterModalProps} handleDiscard={onClose} />
        </>
    );
};

export default AdvancedFilterModal;
