import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';

interface FieldErrorProps {
    id?: string;
    message: string;
}

export const FieldError = ({ id, message }: FieldErrorProps) => (
    <p className="flex flex-nowrap items-center m-0 mt-2 lumo-color-signal-danger" id={id}>
        <IcExclamationCircleFilled className="shrink-0 mr-1" />
        <span className="lumo-label-small">{message}</span>
    </p>
);
