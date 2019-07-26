import React from 'react';
import PropTypes from 'prop-types';
import { SimpleModal, Icon, PrimaryButton, LinkButton, usePlans, Loader } from 'react-components';
import upgradeSvg from 'design-system/assets/img/pm-images/upgrade.svg';
import { c } from 'ttag';
import { DEFAULT_CURRENCY, DEFAULT_CYCLE } from 'proton-shared/lib/constants';

import './UpgradeModal.scss';
import PlanPrice from './PlanPrice';

const UpgradeModal = ({ onUpgrade, onComparePlans, ...rest }) => {
    const [plans = [], loadingPlans] = usePlans();
    const { Pricing = {} } = plans.find(({ Name }) => Name === 'plus') || {};

    const features = [
        c('Info').t`5GB of storage`,
        c('Info').t`5 email addresses`,
        c('Info').t`Custom domain support`,
        c('Info').t`ProtonMail bridge`,
        c('Info').t`Auto-reply, filters & much more`
    ];

    return (
        <SimpleModal className="upgradeModal-container" {...rest}>
            <div className="alignright pt0-5 pr0-5 pb1">
                <button type="reset">
                    <Icon name="close" fill="light" />
                </button>
            </div>
            <div className="pl2 pr2 pb2">
                <div className="flex-autogrid onmobile-flex-column">
                    <div className="flex-autogrid-item flex flex-column flex-spacebetween">
                        <h3 className="bold">{c('Title').t`Upgrade now!`}</h3>
                        {loadingPlans ? (
                            <Loader />
                        ) : (
                            <div className="mb2">
                                <div>{c('Info').t`Unlock additional features with`}</div>
                                <div>
                                    {c('Info').t`ProtonMail Plus for as low as`}{' '}
                                    <PlanPrice
                                        className="bold color-pm-blue"
                                        amount={Pricing[DEFAULT_CYCLE]}
                                        cycle={DEFAULT_CYCLE}
                                        currency={DEFAULT_CURRENCY}
                                    />
                                </div>
                            </div>
                        )}
                        <div>
                            <PrimaryButton
                                className="mr1"
                                onClick={() => {
                                    rest.onClose();
                                    onUpgrade();
                                }}
                            >{c('Action').t`Upgrade ProtonMail`}</PrimaryButton>
                            <LinkButton
                                onClick={() => {
                                    rest.onClose();
                                    onComparePlans();
                                }}
                            >{c('Action').t`Compare all plans`}</LinkButton>
                        </div>
                    </div>
                    <div className="flex-autogrid-item flex flex-column flex-items-end">
                        <img className="h100" src={upgradeSvg} alt={c('Info').t`Upgrade`} />
                    </div>
                </div>
            </div>
            <div className="upgradeModal-footer">
                <ul className="unstyled flex flex-nowrap flex-spacearound">
                    {features.map((text, index) => {
                        const key = `${index}`;
                        return (
                            <li key={key} className="aligncenter pl0-5 pr0-5">
                                <div>
                                    <Icon name="add" size={25} className="fill-pm-blue" />
                                </div>
                                {text}
                            </li>
                        );
                    })}
                </ul>
            </div>
        </SimpleModal>
    );
};

UpgradeModal.propTypes = {
    onUpgrade: PropTypes.func,
    onComparePlans: PropTypes.func
};

export default UpgradeModal;
