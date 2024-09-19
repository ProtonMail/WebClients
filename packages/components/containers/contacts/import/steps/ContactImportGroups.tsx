import type { ChangeEvent, Dispatch, FormEvent, SetStateAction } from 'react';

import { c, msgid } from 'ttag';

import { Button, Input } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import { FORBIDDEN_LABEL_NAMES } from '@proton/shared/lib/constants';
import { omit } from '@proton/shared/lib/helpers/object';
import { normalize } from '@proton/shared/lib/helpers/string';
import type { ContactGroup, ImportContactsModel } from '@proton/shared/lib/interfaces/contacts';
import { IMPORT_GROUPS_ACTION } from '@proton/shared/lib/interfaces/contacts';
import isTruthy from '@proton/utils/isTruthy';

import { ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '../../../../components';
import { useApi, useEventManager } from '../../../../hooks';
import { submitCategories } from '../encryptAndSubmit';

interface SelectGroupActionProps {
    action: IMPORT_GROUPS_ACTION;
    index: number;
    canMerge: boolean;
    onChange: (action: IMPORT_GROUPS_ACTION, index: number) => void;
}

const SelectGroupAction = ({ action, index, canMerge, onChange }: SelectGroupActionProps) => {
    const actionOptions = [
        canMerge && { text: c('Option').t`Add to existing group`, value: IMPORT_GROUPS_ACTION.MERGE },
        { text: c('Option').t`Create new group`, value: IMPORT_GROUPS_ACTION.CREATE },
        { text: c('Option').t`Ignore group`, value: IMPORT_GROUPS_ACTION.IGNORE },
    ].filter(isTruthy);

    return (
        <SelectTwo
            id="contact-group-action-select"
            value={action}
            onChange={({ value }) => onChange(value as IMPORT_GROUPS_ACTION, index)}
            title={c('Title').t`Select action to take on contact group`}
        >
            {actionOptions.map(({ text, value }) => (
                <Option key={value} value={value} title={text} />
            ))}
        </SelectTwo>
    );
};

interface SelectGroupProps {
    targetGroup: ContactGroup;
    targetName: string;
    contactGroups?: ContactGroup[];
    action: IMPORT_GROUPS_ACTION;
    index: number;
    error?: string;
    onChangeTargetGroup: (targetGroup: ContactGroup, index: number) => void;
    onChangeTargetName: (targetName: string, index: number) => void;
    onError: (error: string, index: number) => void;
}

const SelectGroup = ({
    targetGroup,
    targetName,
    contactGroups = [],
    action,
    index,
    error,
    onChangeTargetGroup,
    onChangeTargetName,
    onError,
}: SelectGroupProps) => {
    const groupNames = contactGroups.map(({ Name }) => Name);
    const groupsOptions = contactGroups.map((group) => ({
        text: group.Name,
        value: group,
    }));

    const handleChangeGroupName = ({ target }: ChangeEvent<HTMLInputElement>) => {
        // Clear previous errors
        onError('', index);
        const name = target.value;
        if (!name) {
            onError(c('Error').t`You must set a name`, index);
        } else if (groupNames.includes(name)) {
            onError(c('Error').t`A group with this name already exists`, index);
        } else if (FORBIDDEN_LABEL_NAMES.includes(normalize(name))) {
            onError(c('Error').t`Invalid name`, index);
        }
        onChangeTargetName(target.value, index);
    };

    if (action === IMPORT_GROUPS_ACTION.CREATE) {
        return (
            <Input
                id="contact-group-create"
                placeholder={c('Placeholder').t`Name`}
                maxLength={100}
                title={c('Title').t`Add contact group name`}
                error={error}
                value={targetName}
                onChange={handleChangeGroupName}
            />
        );
    }

    if (action === IMPORT_GROUPS_ACTION.MERGE) {
        return (
            <SelectTwo
                id="contact-group-select"
                value={targetGroup}
                onChange={({ value }) => onChangeTargetGroup(value, index)}
                title={c('Title').t`Select contact group`}
            >
                {groupsOptions.map(({ text, value }) => (
                    <Option key={value.Name} value={value} title={text} />
                ))}
            </SelectTwo>
        );
    }
    return null;
};

interface Props {
    model: ImportContactsModel;
    setModel: Dispatch<SetStateAction<ImportContactsModel>>;
    onClose?: () => void;
}

const ContactImportGroups = ({ model, setModel, onClose }: Props) => {
    const api = useApi();
    const { call } = useEventManager();

    const { categories } = model;

    const cannotSave = categories.some(
        ({ error, action, targetName }) => !!error || (action === IMPORT_GROUPS_ACTION.CREATE && !targetName)
    );

    const handleChangeAction = (action: IMPORT_GROUPS_ACTION, index: number) => {
        setModel((model) => ({
            ...model,
            categories: model.categories.map((category, j) => {
                if (index !== j) {
                    return category;
                }
                return { ...omit(category, ['error']), action };
            }),
        }));
    };

    const handleChangeTargetGroup = (targetGroup: ContactGroup, index: number) => {
        setModel((model) => ({
            ...model,
            categories: model.categories.map((category, j) => {
                if (index !== j) {
                    return category;
                }
                return { ...category, targetGroup };
            }),
        }));
    };

    const handleChangeTargetName = (targetName: string, index: number) => {
        setModel((model) => ({
            ...model,
            categories: model.categories.map((category, j) => {
                if (index !== j) {
                    return category;
                }
                return { ...category, targetName };
            }),
        }));
    };

    const handleSetError = (error: string, index: number) => {
        setModel((model) => ({
            ...model,
            categories: model.categories.map((category, j) => {
                if (index !== j) {
                    return category;
                }
                return { ...category, error };
            }),
        }));
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        event.stopPropagation();

        setModel((model) => ({ ...model, loading: true }));
        await submitCategories(model.categories, api);
        await call();
        setModel((model) => ({ ...model, loading: false }));
        onClose?.();
    };

    const rows = categories.map(({ name, totalContacts, action, targetGroup, targetName, error }, index) => {
        const totalContactsString = c('Import contact groups info').ngettext(
            msgid`${totalContacts} contact`,
            `${totalContacts} contacts`,
            totalContacts
        );
        const categoryString = `${name} (${totalContactsString})`;
        return (
            <div
                key={name}
                className="flex flex-nowrap flex-1 items-stretch sm:items-center flex-column sm:flex-row mb-4 gap-2"
            >
                <div className="sm:flex-1 text-ellipsis" title={categoryString}>
                    {categoryString}
                </div>
                <div className="sm:flex-1">
                    <SelectGroupAction
                        action={action}
                        index={index}
                        canMerge={!!model.contactGroups?.length}
                        onChange={handleChangeAction}
                    />
                </div>
                <div className="sm:flex-1 sm:w-3/10">
                    <SelectGroup
                        contactGroups={model.contactGroups}
                        action={action}
                        targetGroup={targetGroup}
                        targetName={targetName}
                        error={error}
                        index={index}
                        onChangeTargetGroup={handleChangeTargetGroup}
                        onChangeTargetName={handleChangeTargetName}
                        onError={handleSetError}
                    />
                </div>
            </div>
        );
    });

    return (
        <form className="modal-two-dialog-container h-full" onSubmit={handleSubmit}>
            <ModalTwoHeader title={c('Title').t`Import groups`} />
            <ModalTwoContent>
                <Alert className="mb-4">
                    {c('Description')
                        .t`It looks like the contact list you are importing contains some groups. Please review how these groups should be imported.`}
                </Alert>
                {rows}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                <Button color="norm" disabled={cannotSave} loading={model.loading} type="submit">
                    {c('Action').t`Save`}
                </Button>
            </ModalTwoFooter>
        </form>
    );
};

export default ContactImportGroups;
