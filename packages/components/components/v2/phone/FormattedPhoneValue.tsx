import { getFormattedValue } from './helper';

export interface Props {
    value: string;
}

const FormattedPhoneValue = ({ value }: Props) => {
    return getFormattedValue(value);
};

export default FormattedPhoneValue;
