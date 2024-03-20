import { c } from 'ttag';

import { Pill } from '@proton/atoms/Pill';
import clsx from '@proton/utils/clsx';

import BreachSize from './BreachSize';
import ReadableDate from './ReadableDate';

interface BreachInfoProps {
    publishedAt: string;
    category: string | undefined;
    size: number | null;
    country: string | null | undefined;
    exposedData:
        | null
        | {
              code: string;
              name: string;
          }[];
}

const BreachInfo = ({ publishedAt, category, size, country, exposedData }: BreachInfoProps) => {
    return (
        <>
            <h4 className="text-semibold text-rg">{c('Title').t`Breach Information`}</h4>
            <div className={clsx('px-4 flex gap-4 justify-start rounded mb-2')}>
                <div className="flex flex-column">
                    <span className="block text-sm text-semibold">{c('Title').t`Breach Date`}</span>
                    <ReadableDate value={publishedAt} className="block m-0 text-sm color-weak w-max" />
                </div>
                {category && (
                    <div className="flex flex-column">
                        <span className="block text-sm text-semibold">{c('Title').t`Type`}</span>
                        <span className="block m-0 text-sm color-weak">{category}</span>
                    </div>
                )}
                {size && (
                    <div className="flex flex-column">
                        <span className="block text-sm text-semibold">{c('Title').t`Breach Size`}</span>
                        <BreachSize size={size} className="block m-0 text-sm color-weak" />
                    </div>
                )}
                {country && (
                    <div className="flex flex-column">
                        <span className="block text-sm text-semibold">{c('Title').t`Location`}</span>
                        <span className="block m-0 text-sm color-weak">{country}</span>
                    </div>
                )}
                <div>
                    <span className="block text-sm text-semibold">{c('Title').t`Exposed info`}</span>
                    <div className="rounded">
                        {exposedData?.map((data) => {
                            return (
                                <Pill
                                    color="#5c5958"
                                    backgroundColor="#e5e4e1"
                                    className="m-0.5"
                                    key={`${data.code}${data.name}`}
                                >
                                    {data.name}
                                </Pill>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
};

export default BreachInfo;
