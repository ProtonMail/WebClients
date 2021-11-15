import { Fragment } from 'react';
import { c } from 'ttag';
import { toMap } from '@proton/shared/lib/helpers/object';
import { PLANS } from '@proton/shared/lib/constants';

import { useActiveBreakpoint } from '../../../hooks';
import { PlanLabel, Feature } from './interface';
import { PrimaryButton, Tabs, Info } from '../../../components';

interface Props {
    title: string;
    planLabels: PlanLabel[];
    features: Feature[];
    onSelect: (planName: PLANS) => void;
    activeTab: number;
    onSetActiveTab: (activeTab: number) => void;
}

type Tiers = keyof Omit<Feature, 'name' | 'label' | 'tooltip'>;

const Features = ({ title, onSelect, planLabels, features, activeTab, onSetActiveTab }: Props) => {
    const { isNarrow } = useActiveBreakpoint();
    const allowedPlans = toMap(planLabels, 'tier');

    if (isNarrow) {
        return (
            <Tabs value={activeTab} onChange={onSetActiveTab}>
                {planLabels.map(({ label, tier, plan }) => ({
                    title: label,
                    content: (
                        <Fragment key={tier}>
                            <div className="mb1">
                                <PrimaryButton onClick={() => onSelect(plan)}>{c('Action')
                                    .t`Select plan`}</PrimaryButton>
                            </div>
                            <table key={tier} className="text-cut alternate-table-bg-row-rounded w100">
                                <thead>
                                <tr>
                                    <th scope="col" className="text-left">
                                            <span className="flex flex-nowrap flex-items-align-center">
                                                <strong className="flex-item-fluid text-ellipsis" title={title}>
                                                    {title}
                                                </strong>
                                            </span>
                                    </th>
                                    <th scope="col" className="text-left">
                                        {label}
                                    </th>
                                </tr>
                                </thead>
                                <tbody>
                                {features.map(({ name, label, tooltip, ...rest }) => {
                                    return (
                                        <tr key={name}>
                                            <th scope="row" className="text-left">
                                                {label}
                                                {tooltip ? <Info className="ml0-5" title={tooltip} /> : null}
                                            </th>
                                            <td key={tier}>{rest[tier as Tiers]}</td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </Fragment>
                    ),
                }))}
            </Tabs>
        );
    }

    return (
        <table className="alternate-table-bg-row-rounded text-cut w100">
            <thead>
            <tr>
                <th scope="col" className="text-left">
                        <span className="flex flex-nowrap flex-items-align-center">
                            <strong className="flex-item-fluid text-ellipsis text-lg m0" title={title}>
                                {title}
                            </strong>
                        </span>
                </th>
                {planLabels.map(({ label, tier }) => (
                    <th scope="col" className="text-left" key={tier}>
                        {label}
                    </th>
                ))}
            </tr>
            </thead>
            <tbody>
            {features.map(({ name, label, tooltip, ...rest }) => {
                const restKeys = Object.keys(rest) as Tiers[];
                return (
                    <tr key={name}>
                        <th scope="row" className="text-left">
                            {label}
                            {tooltip ? <Info className="ml0-5" title={tooltip} /> : null}
                        </th>
                        {restKeys
                            .filter((key) => allowedPlans[key])
                            .map((key) => {
                                return (
                                    <td className="border-none" key={key}>
                                        {rest[key]}
                                    </td>
                                );
                            })}
                    </tr>
                );
            })}
            </tbody>
        </table>
    );
};

export default Features;
