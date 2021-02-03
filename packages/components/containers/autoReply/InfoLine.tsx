import React from 'react';
import { classnames } from '../../helpers';

interface Props {
    plain: boolean;
    label: React.ReactNode;
    children: React.ReactNode;
}

const InfoLine = ({ label, children, plain = false }: Props) => (
    <tr className="mb1 w100 align-top">
        <td className="pr1">{label}</td>
        <td className={classnames(['w100', !plain && 'text-bold'])}>{children}</td>
    </tr>
);

export default InfoLine;
