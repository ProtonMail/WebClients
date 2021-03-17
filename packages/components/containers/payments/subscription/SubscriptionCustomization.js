import React from 'react';
import PropTypes from 'prop-types';
import { c, msgid } from 'ttag';
import {
    PLANS,
    CYCLE,
    ADDON_NAMES,
    PLAN_SERVICES,
    APPS,
    FREE,
    PLAN_TYPES,
    MAX_VPN_ADDON,
    MAX_ADDRESS_ADDON,
    MAX_SPACE_ADDON,
    MAX_MEMBER_ADDON,
    MAX_DOMAIN_PRO_ADDON,
    MAX_DOMAIN_PLUS_ADDON,
} from 'proton-shared/lib/constants';
import { toMap } from 'proton-shared/lib/helpers/object';
import humanSize from 'proton-shared/lib/helpers/humanSize';
import { hasBit } from 'proton-shared/lib/helpers/bitset';
import { switchPlan, clearPlanIDs } from 'proton-shared/lib/helpers/planIDs';

import { Alert, Price, Loader } from '../../../components';
import { useConfig, useAddresses } from '../../../hooks';
import SubscriptionPlan from './SubscriptionPlan';
import SubscriptionAddonRow from './SubscriptionAddonRow';
import SubscriptionFeatureRow from './SubscriptionFeatureRow';
import MailSubscriptionTable from './MailSubscriptionTable';
import VpnSubscriptionTable from './VpnSubscriptionTable';

const VPNFREE = 'vpnfree';

const TITLE = {
    [FREE]: 'ProtonMail Free',
    [PLANS.PLUS]: 'ProtonMail Plus',
    [PLANS.PROFESSIONAL]: 'ProtonMail Professional',
    [PLANS.VISIONARY]: 'Proton Visionary',
    [VPNFREE]: 'ProtonVPN Free',
    [PLANS.VPNBASIC]: 'ProtonVPN Basic',
    [PLANS.VPNPLUS]: 'ProtonVPN Plus',
};

const Description = ({ planName, setModel, model, plans, organization }) => {
    const plansMap = toMap(plans, 'Name');
    const plusPlan = plansMap[PLANS.PLUS];
    const vpnPlusPlan = plansMap[PLANS.VPNPLUS];
    const upgradeToPlus = (
        <a
            key="upgrade-to-plus"
            onClick={() =>
                setModel({
                    ...model,
                    planIDs: clearPlanIDs(
                        switchPlan({
                            planIDs: model.planIDs,
                            plans,
                            planID: plusPlan.ID,
                            service: PLAN_SERVICES.MAIL,
                            organization,
                        })
                    ),
                })
            }
        >{c('Action').t`Upgrade to ProtonMail Plus`}</a>
    );
    const upgradeToVpnPlus = (
        <a
            key="upgrade-to-vpnplus"
            onClick={() =>
                setModel({
                    ...model,
                    planIDs: clearPlanIDs(
                        switchPlan({
                            planIDs: model.planIDs,
                            plans,
                            planID: vpnPlusPlan.ID,
                            service: PLAN_SERVICES.VPN,
                            organization,
                        })
                    ),
                })
            }
        >{c('Link').t`Upgrade to ProtonVPN Plus`}</a>
    );

    const DESCRIPTION = {
        [FREE]: c('Description plan').jt`To get more features and security, ${upgradeToPlus}.`,
        [PLANS.PLUS]: c('Description plan')
            .t`You can customize the storage, number of addresses, etc, included with ProtonMail Plus.`,
        [PLANS.PROFESSIONAL]: c('Description plan').t`Select the number of users within your organization.`,
        [PLANS.VISIONARY]: c('Description plan').t`Your plan includes both ProtonMail and ProtonVPN Visionary.`,
        [VPNFREE]: c('Description plan')
            .jt`To get advanced security features and the highest speed, ${upgradeToVpnPlus}.`,
        [PLANS.VPNBASIC]: c('Description plan')
            .jt`To get advanced security features and the highest speed, ${upgradeToVpnPlus}.`,
        [PLANS.VPNPLUS]: c('Description plan')
            .t`You can customize the number of connections when combining ProtonVPN with ProtonMail Professional.`,
    };

    const annualBilling = (
        <a key="annual-billing" onClick={() => setModel({ ...model, cycle: CYCLE.YEARLY })}>{c('Link')
            .t`annual billing`}</a>
    );

    return (
        <>
            {model.cycle === CYCLE.MONTHLY && <Alert>{c('Info').jt`Save 20% by switching to ${annualBilling}.`}</Alert>}
            <Alert>{DESCRIPTION[planName]}</Alert>
        </>
    );
};

Description.propTypes = {
    organization: PropTypes.object,
    plans: PropTypes.array.isRequired,
    planName: PropTypes.string.isRequired,
    model: PropTypes.object.isRequired,
    setModel: PropTypes.func.isRequired,
};

const SubscriptionCustomization = ({
    vpnCountries = {},
    organization,
    plans,
    model,
    setModel,
    expanded = false,
    loading = false,
}) => {
    const { APP_NAME } = useConfig();
    const isVPN = APP_NAME === APPS.PROTONVPN_SETTINGS;

    const plansMap = toMap(plans, 'Name');
    const plusPlan = plansMap[PLANS.PLUS];
    const visionaryPlan = plansMap[PLANS.VISIONARY];
    const vpnplusPlan = plansMap[PLANS.VPNPLUS];
    const professionalPlan = plansMap[PLANS.PROFESSIONAL];
    const storageAddon = plansMap[ADDON_NAMES.SPACE];
    const addressAddon = plansMap[ADDON_NAMES.ADDRESS];
    const domainAddon = plansMap[ADDON_NAMES.DOMAIN];
    const memberAddon = plansMap[ADDON_NAMES.MEMBER];
    const vpnAddon = plansMap[ADDON_NAMES.VPN];
    const hasVisionary = !!model.planIDs[visionaryPlan.ID];
    const [addresses, loadingAddresses] = useAddresses();
    const hasAddresses = Array.isArray(addresses) && addresses.length > 0;

    const { mailPlan, vpnPlan } = Object.entries(model.planIDs).reduce(
        (acc, [planID, quantity]) => {
            if (!quantity) {
                return acc;
            }

            const plan = plans.find(({ ID }) => ID === planID);

            if (plan.Type === PLAN_TYPES.PLAN) {
                if (hasBit(plan.Services, PLAN_SERVICES.MAIL)) {
                    acc.mailPlan = plan;
                }

                if (hasBit(plan.Services, PLAN_SERVICES.VPN)) {
                    acc.vpnPlan = plan;
                }
            }

            return acc;
        },
        { mailPlan: { Name: FREE }, vpnPlan: { Name: VPNFREE } }
    );

    const CAN_CUSTOMIZE = {
        [FREE]: false,
        [PLANS.PLUS]: true,
        [PLANS.PROFESSIONAL]: true,
        [PLANS.VISIONARY]: false,
        [VPNFREE]: false,
        [PLANS.VPNBASIC]: false,
        [PLANS.VPNPLUS]: !!model.planIDs[professionalPlan.ID],
    };

    const DESCRIPTIONS = {
        [PLANS.VPNPLUS]: c('Decription')
            .t`VPN connections can be allocated to users within your organization. Each device requires one connection.`,
        [PLANS.PROFESSIONAL]: c('Decription')
            .t`Each additional user comes automatically with 5 GB storage space and 5 email addresses.`,
    };

    const plusAddresses = (model.planIDs[addressAddon.ID] || 0) * addressAddon.MaxAddresses + plusPlan.MaxAddresses;
    const plusDomains = (model.planIDs[domainAddon.ID] || 0) * domainAddon.MaxDomains + plusPlan.MaxDomains;
    const professionalMembers =
        (model.planIDs[memberAddon.ID] || 0) * memberAddon.MaxMembers + professionalPlan.MaxMembers;
    const professionalAddresses =
        (model.planIDs[memberAddon.ID] || 0) * memberAddon.MaxAddresses + professionalPlan.MaxAddresses;
    const professionalDomains =
        (model.planIDs[domainAddon.ID] || 0) * domainAddon.MaxDomains + professionalPlan.MaxDomains;
    const vpnPlusVpn = (model.planIDs[vpnAddon.ID] || 0) * vpnAddon.MaxVPN + vpnplusPlan.MaxVPN;

    const FEATURES = {
        [FREE]: [
            <SubscriptionFeatureRow key="user" icon="organization-users" feature={c('Feature').t`1 user`} />,
            <SubscriptionFeatureRow key="storage" icon="user-storage" feature={c('Feature').t`500 MB storage`} />,
            <SubscriptionFeatureRow key="address" icon="email-address" feature={c('Feature').t`1 email address`} />,
            <SubscriptionFeatureRow key="all" icon="add" feature={c('Feature').t`150 messages per day`} />,
        ],
        [PLANS.PLUS]: [
            <SubscriptionFeatureRow key="user" icon="organization-users" feature={c('Feature').t`1 user`} />,
            <SubscriptionFeatureRow
                key="storage"
                icon="user-storage"
                feature={humanSize(
                    (model.planIDs[storageAddon.ID] || 0) * storageAddon.MaxSpace + plusPlan.MaxSpace,
                    'GB'
                )}
            />,
            <SubscriptionFeatureRow
                key="address"
                icon="email-address"
                feature={c('Feature').ngettext(
                    msgid`${plusAddresses} email address`,
                    `${plusAddresses} email addresses`,
                    plusAddresses
                )}
            />,
            <SubscriptionFeatureRow
                key="domain"
                icon="domains"
                feature={c('Feature').ngettext(
                    msgid`${plusDomains} custom domain`,
                    `${plusDomains} custom domains`,
                    plusDomains
                )}
            />,
            <SubscriptionFeatureRow key="all" icon="add" feature={c('Feature').t`All Plus features`} />,
        ],
        [PLANS.PROFESSIONAL]: [
            <SubscriptionFeatureRow
                key="member"
                icon="organization-users"
                feature={c('Feature').ngettext(
                    msgid`${professionalMembers} user`,
                    `${professionalMembers} users`,
                    professionalMembers
                )}
            />,
            <SubscriptionFeatureRow
                key="storage"
                icon="user-storage"
                feature={humanSize(
                    (model.planIDs[storageAddon.ID] || 0) * storageAddon.MaxSpace + professionalPlan.MaxSpace,
                    'GB'
                )}
            />,
            <SubscriptionFeatureRow
                key="address"
                icon="email-address"
                feature={c('Feature').ngettext(
                    msgid`${professionalAddresses} email address`,
                    `${professionalAddresses} email addresses`,
                    professionalAddresses
                )}
            />,
            <SubscriptionFeatureRow
                key="domain"
                icon="domains"
                feature={c('Feature').ngettext(
                    msgid`${professionalDomains} custom domain`,
                    `${professionalDomains} custom domains`,
                    professionalDomains
                )}
            />,
            <SubscriptionFeatureRow key="all" icon="add" feature={c('Feature').t`All Professional features`} />,
        ],
        [PLANS.VISIONARY]: [
            <SubscriptionFeatureRow key="all" icon="add" feature={c('Feature').t`All ProtonVPN Plus features`} />,
            <SubscriptionFeatureRow key="vpn" icon="vpn-connx" feature={c('Feature').t`10 VPN connections`} />,
            <SubscriptionFeatureRow
                key="mail"
                icon="protonmail"
                feature={c('Plan Feature').t`ProtonMail Visionary account`}
                info={c('Info')
                    .t`Get access to all the paid features for both ProtonVPN and ProtonMail (the encrypted email service that millions use to protect their data) with one plan.`}
                url="https://protonmail.com"
            />,
            <SubscriptionFeatureRow
                key="user"
                icon="organization-users"
                feature={c('Feature').t`6 ProtonMail users`}
            />,
        ],
        [VPNFREE]: [
            <SubscriptionFeatureRow key="connection" icon="vpn-connx" feature={c('Feature').t`1 VPN connection`} />,
            <SubscriptionFeatureRow
                key="country"
                icon="servers-country"
                feature={c('Feature').ngettext(
                    msgid`Servers in ${vpnCountries.free.length} country`,
                    `Servers in ${vpnCountries.free.length} countries`,
                    vpnCountries.free.length
                )}
            />,
            <SubscriptionFeatureRow key="bandwidth" icon="p2p" feature={c('Feature').t`Unlimited bandwidth`} />,
            <SubscriptionFeatureRow
                key="nologs"
                icon="nologs"
                info={c('Info')
                    .t`"ProtonVPN keeps no logs about your internet activity that can compromise your privacy. We don’t store your IP address, physical location, or any other identifiable data."`}
                feature={c('Feature').t`Strict no-logs policy`}
                url="https://protonvpn.com/support/no-logs-vpn/"
            />,
        ],
        [PLANS.VPNBASIC]: [
            <SubscriptionFeatureRow key="connection" icon="vpn-connx" feature={c('Feature').t`2 VPN connections`} />,
            <SubscriptionFeatureRow
                key="country"
                icon="servers-country"
                feature={c('Feature').ngettext(
                    msgid`Servers in ${vpnCountries.basic.length} country`,
                    `Servers in ${vpnCountries.basic.length} countries`,
                    vpnCountries.basic.length
                )}
            />,
            <SubscriptionFeatureRow
                key="netshield"
                icon="netshield"
                feature={c('Feature').t`Adblocker (NetShield)`}
                url="https://protonvpn.com/support/netshield/"
                info={c('Info')
                    .t`NetShield protects your device and speeds up your browsing by blocking ads, trackers, and malware.`}
            />,
            <SubscriptionFeatureRow
                key="p2p"
                icon="p2p"
                url="https://protonvpn.com/support/p2p-vpn-redirection/"
                info={c('Info').t`Support for file sharing protocols such as BitTorrent.`}
                feature={c('Feature').t`P2P/BitTorrent support`}
            />,
            <SubscriptionFeatureRow
                key="nologs"
                icon="nologs"
                info={c('Info')
                    .t`"ProtonVPN keeps no logs about your internet activity that can compromise your privacy. We don’t store your IP address, physical location, or any other identifiable data."`}
                feature={c('Feature').t`Strict no-logs policy`}
                url="https://protonvpn.com/support/no-logs-vpn/"
            />,
        ],
        [PLANS.VPNPLUS]: [
            <SubscriptionFeatureRow
                key="connection"
                icon="vpn-connx"
                feature={c('Feature').ngettext(
                    msgid`${vpnPlusVpn} VPN connection`,
                    `${vpnPlusVpn} VPN connections`,
                    vpnPlusVpn
                )}
            />,
            <SubscriptionFeatureRow
                key="exclusive"
                icon="servers-country"
                feature={c('Feature').t`Plus-exclusive servers`}
            />,
            <SubscriptionFeatureRow
                key="netshield"
                icon="netshield"
                feature={c('Feature').t`Adblocker (NetShield)`}
                url="https://protonvpn.com/support/netshield/"
                info={c('Info')
                    .t`NetShield protects your device and speeds up your browsing by blocking ads, trackers, and malware.`}
            />,
            <SubscriptionFeatureRow
                key="secure"
                url="https://protonvpn.com/support/secure-core-vpn/"
                info={c('Info')
                    .t`Defends against threats to VPN privacy by passing your Internet traffic through multiple servers.`}
                icon="protonvpn"
                feature={c('Feature').t`Secure Core`}
            />,
            <SubscriptionFeatureRow
                key="p2p"
                icon="p2p"
                url="https://protonvpn.com/support/p2p-vpn-redirection/"
                info={c('Info').t`Support for file sharing protocols such as BitTorrent.`}
                feature={c('Feature').t`P2P/BitTorrent support`}
            />,
            <SubscriptionFeatureRow
                key="blocked-content"
                icon="blocked-content"
                feature={c('Feature').t`Access geoblocked content`}
                info={c('Info')
                    .t`Access geo-blocked content (Netflix, Amazon Prime Video, BBC iPlayer, Wikipedia, Facebook, YouTube, etc) no matter where you are.`}
                url="https://protonvpn.com/support/streaming-guide/"
            />,
        ],
    };

    const ADDONS = {
        [PLANS.PLUS]: [
            <SubscriptionAddonRow
                max={MAX_SPACE_ADDON}
                loading={loading}
                key="storage"
                label={c('Label').t`Storage space:`}
                price={
                    <Price currency={model.currency} prefix="+" suffix={c('Suffix').t`/month`}>
                        {(model.planIDs[storageAddon.ID] || 0) * storageAddon.Pricing[CYCLE.MONTHLY]}
                    </Price>
                }
                format={(value) => humanSize(value, 'GB')}
                step={storageAddon.MaxSpace}
                start={plusPlan.MaxSpace}
                quantity={model.planIDs[storageAddon.ID]}
                onChange={(quantity) =>
                    setModel({ ...model, planIDs: { ...model.planIDs, [storageAddon.ID]: quantity } })
                }
            />,
            <SubscriptionAddonRow
                max={MAX_ADDRESS_ADDON}
                loading={loading}
                key="address"
                label={c('Label').t`Email addresses:`}
                price={
                    <Price currency={model.currency} prefix="+" suffix={c('Suffix').t`/month`}>
                        {(model.planIDs[addressAddon.ID] || 0) * plansMap[ADDON_NAMES.ADDRESS].Pricing[CYCLE.MONTHLY]}
                    </Price>
                }
                step={addressAddon.MaxAddresses}
                start={plusPlan.MaxAddresses}
                quantity={model.planIDs[addressAddon.ID]}
                onChange={(quantity) =>
                    setModel({ ...model, planIDs: { ...model.planIDs, [addressAddon.ID]: quantity } })
                }
            />,
            <SubscriptionAddonRow
                max={MAX_DOMAIN_PLUS_ADDON}
                loading={loading}
                key="domain"
                label={c('Label').t`Custom domains:`}
                price={
                    <Price currency={model.currency} prefix="+" suffix={c('Suffix').t`/month`}>
                        {(model.planIDs[domainAddon.ID] || 0) * plansMap[ADDON_NAMES.DOMAIN].Pricing[CYCLE.MONTHLY]}
                    </Price>
                }
                step={domainAddon.MaxDomains}
                start={plusPlan.MaxDomains}
                quantity={model.planIDs[domainAddon.ID]}
                onChange={(quantity) =>
                    setModel({ ...model, planIDs: { ...model.planIDs, [domainAddon.ID]: quantity } })
                }
            />,
        ],
        [PLANS.PROFESSIONAL]: [
            <SubscriptionAddonRow
                max={MAX_MEMBER_ADDON}
                loading={loading}
                key="member"
                label={c('Label').t`Users:`}
                price={
                    <Price currency={model.currency} prefix="+" suffix={c('Suffix').t`/month`}>
                        {(model.planIDs[memberAddon.ID] || 0) * plansMap[ADDON_NAMES.MEMBER].Pricing[CYCLE.MONTHLY]}
                    </Price>
                }
                step={memberAddon.MaxMembers}
                start={professionalPlan.MaxMembers}
                quantity={model.planIDs[memberAddon.ID]}
                onChange={(quantity) =>
                    setModel({ ...model, planIDs: { ...model.planIDs, [memberAddon.ID]: quantity } })
                }
            />,
            <SubscriptionAddonRow
                max={MAX_DOMAIN_PRO_ADDON}
                loading={loading}
                key="domain"
                label={c('Label').t`Custom domains:`}
                price={
                    <Price currency={model.currency} prefix="+" suffix={c('Suffix').t`/month`}>
                        {(model.planIDs[domainAddon.ID] || 0) * plansMap[ADDON_NAMES.DOMAIN].Pricing[CYCLE.MONTHLY]}
                    </Price>
                }
                step={domainAddon.MaxDomains}
                start={professionalPlan.MaxDomains}
                quantity={model.planIDs[domainAddon.ID]}
                onChange={(quantity) =>
                    setModel({ ...model, planIDs: { ...model.planIDs, [domainAddon.ID]: quantity } })
                }
            />,
        ],
        [PLANS.VPNPLUS]: [
            <SubscriptionAddonRow
                max={MAX_VPN_ADDON}
                loading={loading}
                key="vpn"
                label={c('Label').t`VPN connections:`}
                price={
                    <Price currency={model.currency} prefix="+" suffix={c('Suffix').t`/month`}>
                        {(model.planIDs[vpnAddon.ID] || 0) * plansMap[ADDON_NAMES.VPN].Pricing[CYCLE.MONTHLY]}
                    </Price>
                }
                step={vpnAddon.MaxVPN}
                start={vpnplusPlan.MaxVPN}
                quantity={model.planIDs[vpnAddon.ID]}
                onChange={(quantity) => setModel({ ...model, planIDs: { ...model.planIDs, [vpnAddon.ID]: quantity } })}
            />,
        ],
    };

    const sections = [
        hasAddresses && (
            <section className="subscriptionCustomization-section" key="mail-section">
                <h3>{TITLE[mailPlan.Name]}</h3>
                <Description
                    plans={plans}
                    planName={mailPlan.Name}
                    model={model}
                    setModel={setModel}
                    organization={organization}
                />
                <MailSubscriptionTable
                    disabled={loading}
                    currentPlan={c('Status').t`Selected`}
                    selected={c('Status').t`Selected`}
                    planNameSelected={mailPlan.Name}
                    plans={plans}
                    cycle={model.cycle}
                    currency={model.currency}
                    onSelect={(planID) => {
                        setModel({
                            ...model,
                            planIDs: clearPlanIDs(
                                switchPlan({
                                    planIDs: model.planIDs,
                                    plans,
                                    planID,
                                    service: PLAN_SERVICES.MAIL,
                                    organization,
                                })
                            ),
                        });
                    }}
                />
                <SubscriptionPlan
                    expanded={expanded}
                    canCustomize={CAN_CUSTOMIZE[mailPlan.Name]}
                    addons={ADDONS[mailPlan.Name]}
                    features={FEATURES[mailPlan.Name]}
                    currency={model.currency}
                    plan={mailPlan}
                    description={DESCRIPTIONS[mailPlan.Name]}
                />
            </section>
        ),
        <section className="subscriptionCustomization-section" key="vpn-section">
            <h3>{TITLE[vpnPlan.Name]}</h3>
            <Description
                plans={plans}
                planName={vpnPlan.Name}
                model={model}
                setModel={setModel}
                organization={organization}
            />
            <VpnSubscriptionTable
                disabled={loading}
                currentPlan={c('Status').t`Selected`}
                selected={c('Status').t`Selected`}
                planNameSelected={vpnPlan.Name}
                plans={plans}
                cycle={model.cycle}
                currency={model.currency}
                onSelect={(planID) => {
                    setModel({
                        ...model,
                        planIDs: clearPlanIDs(
                            switchPlan({
                                planIDs: model.planIDs,
                                plans,
                                planID,
                                service: PLAN_SERVICES.VPN,
                                organization,
                            })
                        ),
                    });
                }}
            />
            <SubscriptionPlan
                expanded={expanded}
                canCustomize={CAN_CUSTOMIZE[vpnPlan.Name]}
                addons={ADDONS[vpnPlan.Name]}
                features={FEATURES[vpnPlan.Name]}
                currency={model.currency}
                plan={vpnPlan}
                description={DESCRIPTIONS[vpnPlan.Name]}
            />
        </section>,
    ].filter(Boolean);

    if (loadingAddresses) {
        return <Loader />;
    }

    if (isVPN) {
        sections.reverse();
    }

    if (sections.length > 1 && hasVisionary) {
        sections.pop();
    }

    return <div className="subscriptionCustomization-container">{sections}</div>;
};

SubscriptionCustomization.propTypes = {
    organization: PropTypes.object,
    loading: PropTypes.bool,
    vpnCountries: PropTypes.shape({
        free: PropTypes.array,
        basic: PropTypes.array,
        all: PropTypes.array,
    }),
    plans: PropTypes.arrayOf(PropTypes.object).isRequired,
    expanded: PropTypes.bool,
    model: PropTypes.object.isRequired,
    setModel: PropTypes.func.isRequired,
};

export default SubscriptionCustomization;
