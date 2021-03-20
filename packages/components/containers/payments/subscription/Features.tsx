import React, { useState } from 'react';
import { c } from 'ttag';
import { PLANS, APP_NAMES, APPS_CONFIGURATION } from 'proton-shared/lib/constants';

import { useActiveBreakpoint } from '../../../hooks';
import { MailFeature, VPNFeature, CalendarFeature, PlanLabel } from './interface';
import { PrimaryButton, Tabs, Icon, Info } from '../../../components';

interface Props {
    appName: APP_NAMES;
    planLabels: PlanLabel[];
    features: (MailFeature | VPNFeature | CalendarFeature)[];
    onSelect: (planName: PLANS | 'free') => void;
}

type UghRest = keyof Omit<MailFeature | VPNFeature | CalendarFeature, 'name' | 'label'>;

const Features = ({ appName, onSelect, planLabels, features }: Props) => {
    const { isNarrow } = useActiveBreakpoint();
    const [tab, setTab] = useState(0);
    const { icon, name } = APPS_CONFIGURATION[appName];

    if (isNarrow) {
        return (
            <Tabs value={tab} onChange={setTab}>
                {planLabels.map(({ label, key }) => ({
                    title: label,
                    content: (
                        <React.Fragment key={key}>
                            <div className="mb1">
                                <PrimaryButton onClick={() => onSelect(key)}>{c('Action')
                                    .t`Select plan`}</PrimaryButton>
                            </div>
                            <table key={key} className="text-cut alternate-table-bg-row-rounded w100">
                                <thead>
                                    <tr>
                                        <th scope="col" className="w3e" aria-hidden="true">
                                            <Icon name={icon} alt={name} className="mb0-25" />
                                        </th>
                                        <th scope="col" className="text-left">
                                            <strong>{name}</strong>
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
                                                <th aria-hidden="true" />
                                                <th scope="row" className="text-left">
                                                    {label}
                                                    {tooltip ? <Info className="ml0-5" title={tooltip} /> : null}
                                                </th>
                                                <td key={key}>{rest[key as UghRest]}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </React.Fragment>
                    ),
                }))}
            </Tabs>
        );
    }

    return (
        <table className="alternate-table-bg-row-rounded text-cut w100">
            <thead>
                <tr>
                    <th scope="col" className="w3e" aria-hidden="true">
                        <Icon name={icon} alt={name} className="mb0-25" />
                    </th>
                    <th scope="col" className="text-left">
                        <strong>{name}</strong>
                    </th>
                    {planLabels.map(({ label, key }) => (
                        <th scope="col" className="text-left" key={key}>
                            {label}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {features.map(({ name, label, tooltip, ...rest }) => {
                    const restKeys = Object.keys(rest) as UghRest[];
                    return (
                        <tr key={name}>
                            <th aria-hidden="true" />
                            <th scope="row" className="text-left">
                                {label}
                                {tooltip ? <Info className="ml0-5" title={tooltip} /> : null}
                            </th>
                            {restKeys.map((key) => {
                                return (
                                    <td className="no-border" key={key}>
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
