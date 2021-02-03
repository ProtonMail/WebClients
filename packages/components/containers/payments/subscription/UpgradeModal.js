import React from 'react';
import PropTypes from 'prop-types';
import upgradeSvg from 'design-system/assets/img/pm-images/upgrade.svg';
import { c } from 'ttag';
import { DEFAULT_CURRENCY, DEFAULT_CYCLE } from 'proton-shared/lib/constants';

import { SimpleFormModal, Icon, PrimaryButton, LinkButton } from '../../../components';
import PlanPrice from './PlanPrice';
import FeaturesList from './FeaturesList';

const UpgradeModal = ({ plans, onUpgrade, ...rest }) => {
    const { Pricing = {} } = plans.find(({ Name }) => Name === 'plus') || {};

    const features = [
        c('Info').t`5GB of storage`,
        c('Info').t`5 email addresses`,
        c('Info').t`Custom domain support`,
        c('Info').t`ProtonMail bridge`,
        c('Info').t`Auto-reply, filters & much more`,
    ];

    return (
        <SimpleFormModal className="upgradeModal-container" {...rest}>
            <div className="bg-global-altgrey color-white">
                <div className="flex flex-justify-end pt0-5 pr0-5 pb1">
                    <button className="inline-flex" type="reset">
                        <Icon name="close" />
                        <span className="sr-only">{c('Action').t`Close`}</span>
                    </button>
                </div>
                <div className="pl2 pr2 pb2">
                    <div className="flex-autogrid on-mobile-flex-column">
                        <div className="flex-autogrid-item flex flex-column flex-justify-space-between">
                            <h3 className="text-bold">{c('Title').t`Upgrade now!`}</h3>
                            <div className="mb2">
                                <div>{c('Info').t`Unlock additional features with`}</div>
                                <div>
                                    {c('Info').t`ProtonMail Plus for as low as`}{' '}
                                    <PlanPrice
                                        className="text-bold color-primary"
                                        amount={Pricing[DEFAULT_CYCLE]}
                                        cycle={DEFAULT_CYCLE}
                                        currency={DEFAULT_CURRENCY}
                                    />
                                </div>
                            </div>
                            <div>
                                <PrimaryButton
                                    className="mr1"
                                    onClick={() => {
                                        rest.onClose();
                                        onUpgrade();
                                    }}
                                >{c('Action').t`Upgrade ProtonMail`}</PrimaryButton>
                                <LinkButton
                                    className="primary-link hover-same-color"
                                    onClick={() => {
                                        rest.onClose();
                                    }}
                                >{c('Action').t`Compare all plans`}</LinkButton>
                            </div>
                        </div>
                        <div className="flex-autogrid-item flex flex-column flex-align-items-end">
                            <img className="center" src={upgradeSvg} alt={c('Info').t`Upgrade`} />
                        </div>
                    </div>
                </div>
                <div className="upgradeModal-footer bg-global-altgrey-gradient p1">
                    <FeaturesList features={features} />
                </div>
            </div>
        </SimpleFormModal>
    );
};

UpgradeModal.propTypes = {
    plans: PropTypes.array.isRequired,
    onUpgrade: PropTypes.func,
};

export default UpgradeModal;
