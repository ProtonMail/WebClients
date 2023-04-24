import { classnames } from '../../helpers';
import LayoutCard, { LayoutCardProps } from './LayoutCard';

interface Props {
    list: LayoutCardProps[];
    className?: string;
    liClassName?: string;
    describedByID: string;
}

const LayoutCards = ({ list = [], className, liClassName, describedByID }: Props) => {
    return (
        <ul className={classnames(['unstyled m-0 flex', className])}>
            {list.map(({ selected, label, src, onChange, disabled }, index) => {
                return (
                    <li className={liClassName} key={label}>
                        <LayoutCard
                            key={index.toString()}
                            selected={selected}
                            label={label}
                            src={src}
                            onChange={onChange}
                            disabled={disabled}
                            describedByID={describedByID}
                        />
                    </li>
                );
            })}
        </ul>
    );
};

export default LayoutCards;
