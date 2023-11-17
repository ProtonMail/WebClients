import { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

type Props = {
    children: ReactNode;
    className?: string;
    'data-testid'?: string;
    titleDataTestId?: string;
    secondaryTitleElement?: ReactNode;
} & (
    | {
          title: string;
          titleElement?: never;
      }
    | {
          title?: never;
          titleElement: ReactNode;
      }
);

const Panel = ({
    children,
    title,
    titleElement,
    className,
    'data-testid': dataTestId,
    titleDataTestId,
    secondaryTitleElement,
}: Props) => {
    const titleElementToRender = titleElement ?? (
        <h2 className="h3 m-0 pt-0 pb-1">
            <strong data-testid={titleDataTestId}>{title}</strong>
        </h2>
    );

    return (
        <div
            className={clsx(
                'relative border rounded px-6 py-5 flex-align-self-start order-1 lg:order-0 panel',
                className
            )}
            data-testid={dataTestId}
        >
            <div className="flex justify-space-between items-baseline">
                {titleElementToRender}
                {secondaryTitleElement}
            </div>

            {children}
        </div>
    );
};

export default Panel;
