import { Fragment, useMemo } from 'react';
import { c } from 'ttag';

import { getConditionTypeLabels, getComparatorLabels } from '../constants';
import { FilterStatement, SimpleFilterModalModel, ConditionType, ConditionComparator } from '../interfaces';
import { Icon } from '../../../components';
import { classnames } from '../../../helpers';

interface Props {
    isNarrow: boolean;
    model: SimpleFilterModalModel;
    toggleOpen: () => void;
    isOpen: boolean;
}

const FilterPreviewConditions = ({ isOpen, isNarrow, toggleOpen, model }: Props) => {
    const { conditions } = model;

    const conditionsRenderer = useMemo(() => {
        const conditionsRows = conditions?.map((cond) => {
            if (cond.type === ConditionType.ATTACHMENTS) {
                const label =
                    cond.comparator === ConditionComparator.CONTAINS
                        ? c('Label').t`with attachments`
                        : c('Label').t`without attachments`;
                const attachment = isOpen ? (
                    <span
                        key={`filter_preview_${label}`}
                        className="inline-flex flex-row flex-align-items-center condition-token mb0-5"
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
                    element: c('Label').jt`the email was sent ${attachment}`,
                    title: c('Label').t`the email was sent ${label}`,
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
                        className="inline-flex flex-row flex-align-items-center condition-token mb0-5"
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
            <div className="pt0-5">
                {conditionsRows.map((cond, i) => (
                    <div key={`preview-condition-${i}`}>
                        {i === 0 ? ifLabel : operator}
                        {` `}
                        {cond.element}
                    </div>
                ))}
            </div>
        ) : (
            <div className="pt0-5 max-w100 text-ellipsis" title={title}>
                {conditionsRows.map((cond, i) => (
                    <span key={`preview-condition-${i}`}>
                        {i === 0 ? ifLabel : operator.toLowerCase()}
                        {` `}
                        {cond.element}
                    </span>
                ))}
            </div>
        );
    }, [isOpen]);

    return (
        <div className="border-bottom">
            <div className="flex flex-nowrap on-mobile-flex-column align-items-center pt1 pb1">
                <button type="button" className={classnames(['w20 text-left', isNarrow && 'mb1'])} onClick={toggleOpen}>
                    <Icon name="angle-down" className={classnames([isOpen && 'rotateX-180'])} />
                    <span className="ml0-5">{c('Label').t`Conditions`}</span>
                </button>
                <div className={classnames(['flex flex-column flex-item-fluid', !isNarrow && 'ml1'])}>
                    {conditionsRenderer}
                </div>
            </div>
        </div>
    );
};

export default FilterPreviewConditions;
