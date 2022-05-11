import PropTypes from 'prop-types';

import { classnames } from '../../helpers';
import Radio from './Radio';

const RadioGroup = ({ name, options, onChange, value, className }) => {
    const handleChangePlatform = (optionValue) => () => onChange(optionValue);

    return options.map((option, i) => (
        <Radio
            key={i}
            onChange={handleChangePlatform(option.value)}
            checked={value === option.value}
            name={name}
            className={classnames(['mr2', 'mb0-5', 'flex', 'inline-flex-vcenter', className])}
            disabled={option.disabled}
        >
            {option.label}
        </Radio>
    ));
};

RadioGroup.propTypes = {
    className: PropTypes.string,
    name: PropTypes.string.isRequired,
    value: PropTypes.any.isRequired,
    onChange: PropTypes.func.isRequired,
    options: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.node,
            value: PropTypes.any,
            disabled: PropTypes.bool,
        }).isRequired
    ),
};

export default RadioGroup;
