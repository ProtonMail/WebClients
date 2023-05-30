import { ReactNode } from 'react';



import { classnames } from '../../helpers';


interface Props {
    plain: boolean;
    label: ReactNode;
    children: ReactNode;
}

const InfoLine = ({ label, children, plain = false }: Props) => (
    <tr className="mb-4 w100 align-top">
        <td className="pr-4">{label}</td>
        <td className={classnames(['w100', !plain && 'text-bold'])}>{children}</td>
    </tr>
);

export default InfoLine;