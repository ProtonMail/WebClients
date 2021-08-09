import * as React from 'react';
import { classnames } from '../../helpers';
import Icon from '../icon/Icon';

interface Props {
    onClick: (index: number) => void;
    current: number;
    list: React.ReactNode[];
    getIsDisabled?: (index: number) => boolean;
    className?: string;
}

const Breadcrumb = ({ list, current = 0, onClick, className, getIsDisabled }: Props) => {
    const handleClick = (index: number) => () => {
        if (onClick) {
            onClick(index);
        }
    };

    return (
        <ul className={classnames(['breadcrumb-container unstyled inline-flex pl0-5 pr0-5', className])}>
            {list.map((item, index) => {
                const key = index.toString();
                const isLast = index === list.length - 1;
                const isDisabled = getIsDisabled?.(index) ?? false;
                return (
                    <>
                        <li className="breadcrumb-item" key={key}>
                            <button
                                type="button"
                                disabled={index === current || isDisabled}
                                aria-current={current === index ? 'step' : false}
                                onClick={handleClick(index)}
                                key={key}
                                className="breadcrumb-button"
                            >
                                {item}
                            </button>
                        </li>
                        {!isLast && (
                            <li aria-hidden="true" className="inline-flex color-disabled">
                                <Icon size={14} className="flex-item-noshrink mauto" name="angle-down" rotate={270} />
                            </li>
                        )}
                    </>
                );
            })}
        </ul>
    );
};

export default Breadcrumb;
