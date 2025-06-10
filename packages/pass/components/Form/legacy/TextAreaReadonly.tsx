import { type FC, type PropsWithChildren, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/src';
import { FieldBox } from '@proton/pass/components/Form/Field/Layout/FieldBox';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import clsx from '@proton/utils/clsx';

import './TextAreaReadonly.scss';

const CONTAINED_HEIGHT = EXTENSION_BUILD ? 120 : 240;

type Props = { children: string; className?: string; contained?: boolean };

export const TextAreaReadonly: FC<Props> = ({ children, className, contained }) => {
    const [height, setHeight] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);
    const [needsExpansion, setNeedsExpansion] = useState(false);
    const ref = useRef<HTMLTextAreaElement>(null);
    const textAreaHeight = useMemo(
        () => (!contained || isExpanded || height < CONTAINED_HEIGHT ? height : CONTAINED_HEIGHT),
        [isExpanded, height]
    );

    const Container: FC<PropsWithChildren> = useCallback(
        (props) =>
            contained ? (
                <FieldsetCluster mode="read">
                    <FieldBox>{props.children}</FieldBox>
                </FieldsetCluster>
            ) : (
                props.children
            ),
        [contained]
    );

    useLayoutEffect(() => {
        if (ref.current) {
            const scrollHeight = ref.current.scrollHeight;
            setHeight(scrollHeight);
            if (contained && !isExpanded) setNeedsExpansion(scrollHeight > CONTAINED_HEIGHT);
        }
    }, [children, contained, isExpanded]);

    return (
        <Container>
            <textarea
                ref={ref}
                readOnly
                value={children}
                className={clsx(
                    'w-full h-full text-pre-wrap resize-none h-custom pass-textarea--readonly anime-fade-in',
                    className
                )}
                style={{
                    '--h-custom': `${textAreaHeight}px`,
                    transition: 'height 0.3s ease-out',
                    opacity: 1,
                }}
                onClick={(evt) => {
                    if (ref.current) {
                        const { selectionStart, selectionEnd } = ref.current;
                        const hasSelection = selectionStart !== selectionEnd;

                        if (hasSelection) {
                            evt.preventDefault();
                            evt.stopPropagation();
                        }
                    }
                }}
            />
            {contained && needsExpansion && (
                <>
                    {!isExpanded && <span className="mr-1">...</span>}
                    <Button
                        pill
                        shape="underline"
                        className="link link-focus text-nowrap"
                        color="weak"
                        onClick={() => setIsExpanded((prev) => !prev)}
                    >
                        <span className="line-height-1">
                            {isExpanded ? c('Action').t`Show Less` : c('Action').t`Read More`}
                        </span>
                    </Button>
                </>
            )}
        </Container>
    );
};
