import React from 'react';
import PropTypes from 'prop-types';

const InfoLine = ({ label, children, plain }) => (
    <tr className="mb1 w100 aligntop">
        <td className="pr1">{label}</td>
        <td className={`w100 ${plain ? '' : 'bold'}`}>{children}</td>
    </tr>
);

InfoLine.propTypes = {
    plain: PropTypes.bool,
    label: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired
};

InfoLine.defaultProps = {
    plain: false
};

export default InfoLine;
