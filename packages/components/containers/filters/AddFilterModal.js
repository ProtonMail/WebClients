import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    Button,
    FormModal,
    ResetButton,
    PrimaryButton,
    useEventManager,
    useNotifications,
    useApiWithoutResult
} from 'react-components';
import { newFilter, format as formatFilter } from 'proton-shared/lib/filters/factory';
import { validate, validateComplex } from 'proton-shared/lib/filters/validator';
import { addTreeFilter, updateFilter } from 'proton-shared/lib/api/filters';
import { noop } from 'proton-shared/lib/helpers/function';

import ConditionsEditor from '../../containers/filters/editor/Conditions';
import ActionsEditor from '../../containers/filters/editor/Actions';
import OperatorEditor from '../../containers/filters/editor/Operator';
import SieveEditor from '../../containers/filters/editor/Sieve';
import PreviewFilter from '../../containers/filters/editor/Preview';
import NameEditor from '../../containers/filters/editor/Name';

import './AddFilterModal.css';

function AddFilterModal({ filter, type, mode, onEdit, ...props }) {
    const [filterModel] = useState(() => newFilter(filter, type));
    const [errors, setErrors] = useState({});
    const [model, setModel] = useState(filterModel);
    const [isPreview, setPreview] = useState(false);
    const [isInvalid, setValitidy] = useState(false);
    const [sieveCode, setSieveCode] = useState(filterModel.Sieve || '');

    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const reqCreate = useApiWithoutResult(addTreeFilter);
    const reqUpdate = useApiWithoutResult(updateFilter);

    const create = async (filter) => {
        const { Filter } = await reqCreate.request(filter);
        call();
        createNotification({
            text: c('Notification').t`${Filter.Name} created`
        });
        props.onClose();
    };

    const update = async (filter) => {
        const { Filter } = await reqUpdate.request(filter.ID, filter);
        call();
        createNotification({
            text: c('Filter notification').t`Filter ${Filter.Name} updated`
        });
        onEdit(Filter);
        props.onClose();
    };

    const ACTIONS = { create, update };

    const handleChange = (key) => (data) => {
        setModel((previous) => {
            return {
                ...previous,
                Simple: {
                    ...previous.Simple,
                    [key]: Array.isArray(data) ? data : { ...previous.Simple[key], ...data }
                }
            };
        });
    };

    const validateFilter = (filter) => {
        if (type === 'complex') {
            const { isValid, ...errors } = validateComplex(filter, isInvalid);
            if (isInvalid || !isValid) {
                setErrors(errors);
                return false;
            }

            return true;
        }

        const { isValid, ...errors } = validate(filter);

        if (!isValid) {
            setErrors(errors);
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (type === 'complex') {
            const filter = {
                ...model,
                Sieve: sieveCode
            };
            const isValid = validateFilter(filter);
            return isValid && ACTIONS[mode](formatFilter(filter, 'complex'));
        }

        const filter = formatFilter(model, 'simple');
        const isValid = validateFilter(filter);
        isValid && ACTIONS[mode](filter);
    };

    const handleChangeName = (Name) => setModel({ ...model, Name });
    const handleClickPreview = () => setPreview(!isPreview);
    const handleChangeBeforeLint = () => setValitidy(true);
    const handleChangeSieve = (err, code) => {
        setValitidy(err);
        if (!err) {
            setSieveCode(code);
        }
    };

    const getFooter = (loading) => {
        if (isPreview) {
            return (
                <>
                    <Button type="button" onClick={handleClickPreview}>{c('Action').t`Back`}</Button>
                    <PrimaryButton loading={loading}>{c('Action').t`Save`}</PrimaryButton>
                </>
            );
        }

        return (
            <>
                <ResetButton disabled={loading}>{c('Action').t`Close`}</ResetButton>
                {type !== 'complex' ? (
                    <Button type="button" className="mlauto mr1" disabled={loading} onClick={handleClickPreview}>{c(
                        'Action'
                    ).t`Preview`}</Button>
                ) : null}
                <PrimaryButton type="submit" loading={loading}>
                    {c('Action').t`Save`}
                </PrimaryButton>
            </>
        );
    };

    return (
        <FormModal
            onSubmit={handleSubmit}
            loading={reqCreate.loading || reqUpdate.loading}
            noValidate={true}
            className={isPreview ? 'AddFilterModal-isPreview' : ''}
            title={
                !isPreview ? c('Add Filter Modal').t`Custom Filter` : c('Add Filter Modal').t`Custom Filter (Preview)`
            }
            onClose={props.onClose}
            footer={getFooter(reqCreate.loading || reqUpdate.loading)}
            {...props}
        >
            {type === 'complex' ? (
                <div className="AddFilterModal-editor">
                    <NameEditor error={errors.name} filter={filterModel} onChange={handleChangeName} />
                    <SieveEditor
                        filter={filterModel}
                        onChange={handleChangeSieve}
                        onChangeBeforeLint={handleChangeBeforeLint}
                    />
                </div>
            ) : null}

            {type !== 'complex' ? (
                <div className="AddFilterModal-editor">
                    <NameEditor error={errors.name} filter={filterModel} onChange={handleChangeName} />
                    <OperatorEditor filter={filterModel} onChange={handleChange('Operator')} />
                    <ConditionsEditor
                        errors={errors.conditions}
                        filter={filterModel}
                        onChange={handleChange('Conditions')}
                    />
                    <ActionsEditor errors={errors.actions} filter={filterModel} onChange={handleChange('Actions')} />
                </div>
            ) : null}

            {isPreview ? <PreviewFilter filter={model} /> : null}
        </FormModal>
    );
}

AddFilterModal.propTypes = {
    onEdit: PropTypes.func,
    mode: PropTypes.string,
    type: PropTypes.string
};

AddFilterModal.defaultProps = {
    onEdit: noop,
    mode: 'create'
};

export default AddFilterModal;
