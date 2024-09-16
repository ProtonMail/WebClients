import { Fragment, useMemo } from 'react';

import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';
import clsx from '@proton/utils/clsx';

import { getComparatorLabels, getConditionTypeLabels } from '../constants';
import type { SimpleFilterModalModel } from '../interfaces';
import { ConditionType, FilterStatement } from '../interfaces';
import { getConditionLabel, getEmailSentLabel, getEmailSentLabelJt } from './helper';

interface Props {
    model: SimpleFilterModalModel;
    toggleOpen: () => void;
    isOpen: boolean;
}

const FilterPreviewConditions = ({ isOpen, toggleOpen, model }: Props) => {
    const { conditions } = model;

    const conditionsRenderer = useMemo(() => {
        const conditionsRows = conditions?.map((cond) => {
            if (cond.type === ConditionType.ATTACHMENTS) {
                const label = getConditionLabel(cond);
                const attachment = isOpen ? (
                    <span
                        key={`filter_preview_${label}`}
                        className="inline-flex flex-row items-center condition-token mb-2 max-w-full"
                        role="listitem"
                    >
                        <span className="text-ellipsis text-no-decoration" title={label}>
                            {label}
                        </span>
                    </span>
                ) : (
                    <strong key={`open_filter_preview_${label}`}>{label}</strong>
                );

                return {
                    element: getEmailSentLabelJt(attachment),
                    title: getEmailSentLabel(label),
                };
            }

            const typeLabel = getConditionTypeLabels(cond.type);
            const comparatorLabel = getComparatorLabels(cond.comparator);

            const titleValues = cond?.values?.map((v, i) => {
                return i > 0 ? ` or ${v}` : v;
            });

            const values = cond?.values?.map((v, i) => {
                const value = isOpen ? (
                    <span
                        key={`${v}${i}`}
                        className="inline-flex flex-row items-center condition-token mb-2 max-w-full"
                        role="listitem"
                    >
                        <span className="text-ellipsis text-no-decoration" title={v}>
                            {v}
                        </span>
                    </span>
                ) : (
                    <strong key={`${v}${i}`}>{v}</strong>
                );
                return i > 0 ? (
                    <Fragment key={`preview_condition_${v}${i}`}>
                        {` `}
                        {c('Label').t`or`}
                        {` `}
                        {value}
                    </Fragment>
                ) : (
                    value
                );
            });

            return {
                element: (
                    <>
                        {typeLabel?.toLowerCase()}
                        {` `}
                        {comparatorLabel}
                        {` `}
                        {values}
                    </>
                ),
                title: `${typeLabel?.toLowerCase()} ${comparatorLabel} ${titleValues}`,
            };
        });

        const ifLabel = c('Label').t`If`;
        const operator = model.statement === FilterStatement.ALL ? c('Label').t`And` : c('Label').t`Or`;
        const title: string = conditionsRows.reduce((acc, cond, i) => {
            acc += i === 0 ? ifLabel : ` ${operator.toLowerCase()}`;
            return `${acc} ${cond.title}`;
        }, '');

        return isOpen ? (
            <div className="pt-2 max-w-full">
                {conditionsRows.map((cond, i) => (
                    <div key={`preview-condition-${i}`}>
                        {i === 0 ? ifLabel : operator}
                        {` `}
                        {cond.element}
                    </div>
                ))}
            </div>
        ) : (
            <div className="pt-2 max-w-full text-ellipsis" title={title}>
                {conditionsRows.map((cond, i) => (
                    <span key={`preview-condition-${i}`}>
                        {i === 0 ? ifLabel : <span className="ml-1">{operator.toLowerCase()}</span>}
                        {` `}
                        {cond.element}
                    </span>
                ))}
            </div>
        );
    }, [isOpen]);

    return (
        <div className="border-bottom">
            <div className="flex flex-nowrap flex-column md:flex-row align-items-center py-4 gap-4">
                <button type="button" className="w-full md:w-1/4 text-left" onClick={toggleOpen}>
                    <Icon name="chevron-down" className={clsx([isOpen && 'rotateX-180'])} />
                    <span className="ml-2">{c('Label').t`Conditions`}</span>
                </button>
                <div className="flex flex-column w-full">{conditionsRenderer}</div>
            </div>
        </div>
    );
};

export default FilterPreviewConditions;
