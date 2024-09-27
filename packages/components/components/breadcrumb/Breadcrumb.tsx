import type { ReactNode } from 'react';
import { Fragment } from 'react';

import Icon from '@proton/components/components/icon/Icon';
import clsx from '@proton/utils/clsx';

interface Props {
    onClick: (index: number) => void;
    current: number;
    list: ReactNode[];
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
        <ul className={clsx(['breadcrumb-container unstyled inline-flex px-2', className])}>
            {list.map((item, index) => {
                const key = index.toString();
                const isLast = index === list.length - 1;
                const isDisabled = getIsDisabled?.(index) ?? false;
                return (
                    <Fragment key={key}>
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
                                <Icon size={3.5} className="shrink-0 m-auto" name="chevron-right" />
                            </li>
                        )}
                    </Fragment>
                );
            })}
        </ul>
    );
};

export default Breadcrumb;
