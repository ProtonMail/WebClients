import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Title } from 'react-components';
import RedeemCouponForm from '../components/sections/redeem/RedeemCouponForm';
import PublicHeader from '../components/layout/PublicHeader';

import GadgetImage from 'design-system/assets/img/pv-images/redeem/gadgets.png';
import SwissBasedIcon from 'design-system/assets/img/pv-images/redeem/swiss_based.svg';
import SecureCoreIcon from 'design-system/assets/img/pv-images/redeem/secure_core.svg';
import NoLogsIcon from 'design-system/assets/img/pv-images/redeem/no_logs.svg';
import KillSwitchIcon from 'design-system/assets/img/pv-images/redeem/kill_switch.svg';
import DNSIcon from 'design-system/assets/img/pv-images/redeem/dns.svg';
import EncryptionIcon from 'design-system/assets/img/pv-images/redeem/encryption.svg';

const RedeemContainer = () => (
    <div>
        <PublicHeader />
        <div className="redeem-heading-bg pt1">
            <div className="mw80 center">
                <Title className="redeem-heading-title mt2 mb1-5 color-white bold">
                    {c('Title').t`Redeem your coupon and start protecting your online privacy`}
                </Title>
                <div className="flex">
                    <RedeemCouponForm />
                    <div className="col center nomobile notablet">
                        <img
                            src={GadgetImage}
                            alt={c('Image alt').t`Laptop & smartphone shown connected to ProtonVPN network.`}
                        />
                    </div>
                </div>
            </div>
        </div>
        <div className="bg-global-light pt2 pb2">
            <div className="flex flex-spacebetween onmobile-flex-column aligncenter w70 center mt2">
                {[
                    {
                        icon: SwissBasedIcon,
                        alt: c('Image alt').t`Swiss based`,
                        title: c('Title').t`Swiss Based`,
                        about: c('About').t`Protect yourself with some of the world's toughest Swiss Privacy laws.`
                    },
                    {
                        icon: SecureCoreIcon,
                        alt: c('Image alt').t`Secure core servers`,
                        title: c('Title').t`Secure Core Servers`,
                        about: c('About')
                            .t`Enable military-grade network defense using Secure Core servers located below the surface.`
                    },
                    {
                        icon: NoLogsIcon,
                        alt: c('Image alt').t`No logs`,
                        title: c('Title').t`No Logs`,
                        about: c('About').t`Shield your privacy with strict ProtonVPN no logs policy.`
                    },
                    {
                        icon: KillSwitchIcon,
                        alt: c('Image alt').t`Kill switch to prevent IP exposure`,
                        title: c('Title').t`Kill Switch`,
                        about: c('About')
                            .t`Prevent your IP address from online exposure with built-in Kill Switch feature.`
                    },
                    {
                        icon: DNSIcon,
                        alt: c('Image alt').t`DNS leak prevention`,
                        title: c('Title').t`DNS leak prevention`,
                        about: c('About')
                            .t`Keep your online activities to yourself as we prevent your DNS queries from leaking.`
                    },
                    {
                        icon: EncryptionIcon,
                        alt: c('Image alt').t`Strong encryption`,
                        title: c('Title').t`Strong encryption`,
                        about: c('About')
                            .t`Protect your internet connection with the highest strengh encryption for the most secure connection possible.`
                    }
                ].map(({ icon, alt, title, about }) => (
                    <figure key={title} className="shadow-container w30 mb2 bg-white color-global-altgrey p1">
                        <img src={icon} alt={alt} className="redeem-promo-img center mt1 mb1" />
                        <figcaption>
                            <h2>{title}</h2>
                            <p>{about}</p>
                        </figcaption>
                    </figure>
                ))}
            </div>
        </div>
    </div>
);

RedeemContainer.propTypes = {
    history: PropTypes.object
};

export default RedeemContainer;
