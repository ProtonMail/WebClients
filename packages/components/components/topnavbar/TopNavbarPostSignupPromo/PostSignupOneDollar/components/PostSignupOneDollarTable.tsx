import { Fragment, type ReactNode } from 'react';

import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import { type FeatureProps } from '../interface';

import './PostSignupOneDollarTable.scss';

interface Props {
    features: FeatureProps[];
}

export const TableCell = ({ content, className }: { content: ReactNode; className: string }) => {
    if (typeof content === 'string') {
        return <p className={className}>{content}</p>;
    }
    return <div className={className}>{content}</div>;
};

export const PostSignupOneDollarTable = ({ features }: Props) => {
    return (
        <div className="feature-table-layout w-full mb-4">
            <span />
            <p className="m-0 py-2 text-semibold px-1 mr-1 text-center">{c('Offer feature').t`Free`}</p>
            <div className="feature-table-item-gradient flex items-center table-rounded py-1 px-1 bg-weak text-center text-semibold">
                <p className="m-0 flex-1 py-1 color-invert rounded">{c('Offer feature').t`Plus`}</p>
            </div>
            {features.map((item, i) => {
                const isNotLast = i !== features.length - 1;
                const borderClasses = isNotLast && 'border-bottom border-weak';

                return (
                    <Fragment key={item.id}>
                        <TableCell
                            content={item.title}
                            className={clsx('feature-table-item m-0 py-3', borderClasses)}
                        />
                        <TableCell
                            content={item.free}
                            className={clsx(
                                'feature-table-item m-0 py-3 flex items-center justify-center text-semibold',
                                borderClasses
                            )}
                        />
                        <TableCell
                            content={item.plus}
                            className={clsx(
                                'feature-table-item m-0 py-3 flex items-center justify-center text-semibold bg-weak',
                                borderClasses
                            )}
                        />
                    </Fragment>
                );
            })}
        </div>
    );
};
