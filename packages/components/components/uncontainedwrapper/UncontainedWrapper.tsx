import { type ComponentPropsWithoutRef, type ReactNode, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import clsx from '@proton/utils/clsx';

import Icon from '../icon/Icon';

import './UncontainedWrapper.scss';

interface UncontainedWrapperProps extends ComponentPropsWithoutRef<'div'> {
    children: ReactNode;
    className?: string;
    innerClassName?: string;
}

const SLIDE_DISTANCE = 200;

const UncontainedWrapper = ({ children, className, innerClassName, ...rest }: UncontainedWrapperProps) => {
    const uncontainedWrapperRef = useRef<HTMLDivElement>(null);
    const [showButtons, setShowButtons] = useState(false);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const scroll = (direction: number) => {
        if (uncontainedWrapperRef.current) {
            uncontainedWrapperRef.current.scrollBy({ left: direction * SLIDE_DISTANCE, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        const checkOverflow = () => {
            const { current } = uncontainedWrapperRef;
            if (current) {
                setShowButtons(current.scrollWidth > current.clientWidth);
                setCanScrollLeft(current.scrollLeft > 0);
                setCanScrollRight(current.scrollLeft + current.clientWidth < current.scrollWidth);
            }
        };

        checkOverflow();
        window.addEventListener('resize', checkOverflow);

        const handleScroll = () => {
            const { current } = uncontainedWrapperRef;
            if (current) {
                setCanScrollLeft(current.scrollLeft > 0);
                setCanScrollRight(current.scrollLeft + current.clientWidth < current.scrollWidth);
            }
        };

        const container = uncontainedWrapperRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
        }
        return () => {
            window.removeEventListener('resize', checkOverflow);
            if (container) {
                container.removeEventListener('scroll', handleScroll);
            }
        };
    }, []);

    return (
        <div className={clsx('relative', className)} data-testid="uncontained-wrapper-container">
            {showButtons && canScrollLeft && (
                <div className="uncontained-wrapper-prev-button-container absolute left-0 z-up bg-norm shrink-0">
                    <Tooltip title={c('Action').t`Display previous`}>
                        <Button shape="ghost" icon onClick={() => scroll(-1)}>
                            <Icon name="chevron-left" className="rtl:mirror" alt={c('Action').t`Display previous`} />
                        </Button>
                    </Tooltip>
                </div>
            )}
            <div
                ref={uncontainedWrapperRef}
                className={clsx('uncontained-wrapper overflow-auto outline-none--at-all', innerClassName)}
                data-testid="uncontained-wrapper"
                {...rest}
            >
                {children}
            </div>
            {showButtons && canScrollRight && (
                <div className="uncontained-wrapper-next-button-container absolute z-up bg-norm shrink-0">
                    <Tooltip title={c('Action').t`Display next`}>
                        <Button shape="ghost" icon onClick={() => scroll(1)}>
                            <Icon name="chevron-right" className="rtl:mirror" alt={c('Action').t`Display next`} />
                        </Button>
                    </Tooltip>
                </div>
            )}
        </div>
    );
};

export default UncontainedWrapper;
