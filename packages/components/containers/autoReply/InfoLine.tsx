import * as React from 'react';

interface Props {
    plain: boolean;
    label: React.ReactNode;
    children: React.ReactNode;
}

const InfoLine = ({ label, children, plain = false }: Props) => (
    <tr className="mb1 w100 aligntop">
        <td className="pr1">{label}</td>
        <td className={`w100 ${plain ? '' : 'bold'}`}>{children}</td>
    </tr>
);

export default InfoLine;
