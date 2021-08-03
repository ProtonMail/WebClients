import { Fragment } from 'react';
import { c } from 'ttag';
import { PLANS, APP_NAMES, APPS_CONFIGURATION } from '@proton/shared/lib/constants';

import { useActiveBreakpoint } from '../../../hooks';
import { MailFeature, VPNFeature, CalendarFeature, DriveFeature, PlanLabel } from './interface';
import { PrimaryButton, Tabs, Icon, Info } from '../../../components';

interface Props {
    appName: APP_NAMES;
    planLabels: PlanLabel[];
    features: (MailFeature | VPNFeature | CalendarFeature | DriveFeature)[];
    onSelect: (planName: PLANS | 'free') => void;
    activeTab: number;
    onSetActiveTab: (activeTab: number) => void;
}

type UghRest = keyof Omit<MailFeature | VPNFeature | CalendarFeature | DriveFeature, 'name' | 'label' | 'tooltip'>;

const Features = ({ appName, onSelect, planLabels, features, activeTab, onSetActiveTab }: Props) => {
    const { isNarrow } = useActiveBreakpoint();
    const { icon, name } = APPS_CONFIGURATION[appName];

    // translator: <ProtonDrive> (beta)
    const displayName = `${name} ${name === 'ProtonDrive' ? c('info').t`(beta)` : ''}`;

    if (isNarrow) {
        return (
            <Tabs value={activeTab} onChange={onSetActiveTab}>
                {planLabels.map(({ label, key }) => ({
                    title: label,
                    content: (
                        <Fragment key={key}>
                            <div className="mb1">
                                <PrimaryButton onClick={() => onSelect(key)}>{c('Action')
                                    .t`Select plan`}</PrimaryButton>
                            </div>
                            <table key={key} className="text-cut alternate-table-bg-row-rounded w100">
                                <thead>
                                    <tr>
                                        <th scope="col" className="text-left">
                                            <span className="flex flex-nowrap flex-items-align-center">
                                                <Icon
                                                    name={icon}
                                                    alt=""
                                                    size={20}
                                                    className="color-primary flex-item-noshrink"
                                                />
                                                <strong
                                                    className="ml0-5 flex-item-fluid text-ellipsis"
                                                    title={displayName}
                                                >
                                                    {displayName}
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
                                                <td key={key}>{rest[key as UghRest]}</td>
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
                            <Icon name={icon} alt="" size={20} className="color-primary flex-item-noshrink" />
                            <strong className="ml0-5 flex-item-fluid text-ellipsis" title={displayName}>
                                {displayName}
                            </strong>
                        </span>
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
