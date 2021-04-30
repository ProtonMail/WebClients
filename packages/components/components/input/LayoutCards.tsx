import React from 'react';

import LayoutCard, { LayoutCardProps } from './LayoutCard';

interface Props {
    list: LayoutCardProps[];
    liClassName?: string;
    describedByID: string;
}

const LayoutCards = ({ list = [], liClassName, describedByID }: Props) => {
    return (
        <ul className="unstyled m0 flex">
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
