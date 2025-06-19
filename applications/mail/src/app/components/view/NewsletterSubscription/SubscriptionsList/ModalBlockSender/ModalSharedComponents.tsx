import { c } from 'ttag';

import { Checkbox, Label } from '@proton/components';
import clsx from '@proton/utils/clsx';

interface Props {
    label: string;
    id: string;
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
    labelClassName?: string;
    dataTestId?: string;
}

export const ModalCheckboxWithLabel = ({
    label,
    id,
    checked,
    onChange,
    disabled,
    labelClassName,
    dataTestId,
}: Props) => {
    return (
        <div className="flex flex-row items-start align-center mb-3">
            <Checkbox
                checked={checked}
                onChange={onChange}
                className="mr-2"
                id={id}
                disabled={disabled}
                data-testid={dataTestId}
            />
            <Label htmlFor={id} className={clsx('p-0 flex-1', labelClassName)}>
                {label}
            </Label>
        </div>
    );
};

interface ModalSharedCheckboxesProps {
    checkboxes: Record<string, boolean>;
    setCheckboxes: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export const ModalSharedCheckboxes = ({ checkboxes, setCheckboxes }: ModalSharedCheckboxesProps) => {
    return (
        <>
            <ModalCheckboxWithLabel
                label={c('Info').t`Trash existing messages`}
                id="trash"
                checked={checkboxes.trash}
                onChange={() => {
                    setCheckboxes((prev) => ({
                        ...prev,
                        archive: false,
                        trash: !prev.trash,
                    }));
                }}
                dataTestId="trash-checkbox"
            />

            <ModalCheckboxWithLabel
                label={c('Info').t`Archive existing messages`}
                id="archive"
                checked={checkboxes.archive}
                onChange={() => {
                    setCheckboxes((prev) => ({
                        ...prev,
                        archive: !prev.archive,
                        trash: false,
                    }));
                }}
                dataTestId="archive-checkbox"
            />

            <ModalCheckboxWithLabel
                label={c('Info').t`Mark all as read`}
                id="read"
                checked={checkboxes.read}
                onChange={() => {
                    setCheckboxes((prev) => ({
                        ...prev,
                        read: !prev.read,
                    }));
                }}
                dataTestId="read-checkbox"
            />
        </>
    );
};
