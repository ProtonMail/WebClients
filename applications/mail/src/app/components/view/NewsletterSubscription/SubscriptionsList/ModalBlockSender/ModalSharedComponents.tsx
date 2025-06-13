import { Checkbox, Label } from '@proton/components';
import clsx from '@proton/utils/clsx';

interface Props {
    label: string;
    id: string;
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
    labelClassName?: string;
}

export const ModalCheckboxWithLabel = ({ label, id, checked, onChange, disabled, labelClassName }: Props) => {
    return (
        <div className="flex flex-row items-start align-center mb-3">
            <Checkbox checked={checked} onChange={onChange} className="mr-2" id={id} disabled={disabled} />
            <Label htmlFor={id} className={clsx('p-0 flex-1', labelClassName)}>
                {label}
            </Label>
        </div>
    );
};
