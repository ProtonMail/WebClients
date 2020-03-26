import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { generateUID, classnames } from '../../helpers/component';
import useInput from '../input/useInput';
import ErrorZone from '../text/ErrorZone';

const DEFAULT_GROUP = 'GROUP';

const buildOptions = (options = []) => {
    return options.map(({ text, ...rest }, index) => (
        <option key={index.toString()} {...rest}>
            {text}
        </option>
    ));
};

/** @type any */
const Select = ({
    options,
    error,
    size = 1,
    className = '',
    multiple = false,
    loading = false,
    isSubmitted = false,
    ...rest
}) => {
    const { handlers, statusClasses, status } = useInput({ isSubmitted, ...rest });
    const [uid] = useState(generateUID('select'));
    const hasError = error && (status.isDirty || isSubmitted);
    const hasGroup = options.some(({ group }) => group);

    return (
        <>
            <select
                className={classnames(['pm-field w100', className, statusClasses])}
                size={size}
                multiple={multiple}
                disabled={loading || rest.disabled}
                {...rest}
                {...handlers}
            >
                {hasGroup
                    ? Object.entries(
                          options.reduce((acc, option) => {
                              const { group = DEFAULT_GROUP } = option;
                              acc[group] = acc[group] || [];
                              acc[group].push(option);
                              return acc;
                          }, {})
                      ).map(([group, options], index) => {
                          return (
                              <optgroup key={index.toString()} label={group}>
                                  {buildOptions(options)}
                              </optgroup>
                          );
                      })
                    : buildOptions(options)}
            </select>
            <ErrorZone id={uid}>{hasError ? error : ''}</ErrorZone>
        </>
    );
};

Select.propTypes = {
    error: PropTypes.string,
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
    isSubmitted: PropTypes.bool,
    size: PropTypes.number,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    onFocus: PropTypes.func,
    options: PropTypes.arrayOf(
        PropTypes.shape({
            value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            text: PropTypes.string,
            group: PropTypes.string
        })
    ),
    multiple: PropTypes.bool,
    className: PropTypes.string
};

export default Select;
