import _ from 'lodash';
import { decryptPrivateKey, encryptPrivateKey } from 'pmcrypto';
import { computeKeyPassword, generateKeySalt } from 'pm-srp';

import { BASE_SIZE, DEFAULT_ENCRYPTION_CONFIG } from '../../constants';

/* @ngInject */
function setupOrganizationModal(
    authentication,
    pmModal,
    networkActivityTracker,
    organizationApi,
    organizationModel,
    memberApi,
    setupKeys,
    gettextCatalog
) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/setupOrganization.tpl.html'),
        /* @ngInject */
        controller: function(params, $scope) {
            const self = this;

            const I18N = {
                ERROR_PASSWORD_INPUT: gettextCatalog.getString(
                    'You must add a password for the organization',
                    null,
                    'Error'
                )
            };

            const base = BASE_SIZE;
            const steps = ['name', 'keys', 'password', 'storage'];
            const methods = [name, keys, password, storage, vpn];
            const payload = {};
            const organization = organizationModel.get();
            const defaultStorage = 5;
            const defaultVPN = 3;
            let index = 0;
            let decryptedKey;

            // Add the vpn step only for paid VPN subscription
            if (authentication.hasPaidVpn()) {
                steps.push('vpn');
            }

            self.step = steps[index];
            self.encryptionConfigName = DEFAULT_ENCRYPTION_CONFIG;
            self.size = self.encryptionConfigName;

            const allocatedLegend = {
                label: gettextCatalog.getString('Allocated to admin', null, 'Success'),
                classes: 'background-primary'
            };
            const minPaddingLegend = {
                label: gettextCatalog.getString('Already used', null, 'Info'),
                classes: 'background-red-striped'
            };

            // Quotas
            self.min = 0;
            self.max = organization.MaxSpace;
            self.unit = base * base * base;
            self.userUsedSpace = authentication.user.UsedSpace;

            const minPadding = authentication.user.UsedSpace / self.unit;

            self.sliderOptions = {
                animate: false,
                start: Math.min(
                    Math.max(Math.round(authentication.user.UsedSpace / self.unit + 1), defaultStorage),
                    self.max / self.unit
                ),
                step: 0.1,
                connect: [true, false],
                tooltips: true,
                range: { min: self.min / self.unit, max: self.max / self.unit },
                pips: {
                    mode: 'values',
                    values: [0, self.max / self.unit],
                    density: 4
                },
                minPadding,
                legend: 'GB'
            };

            self.legends = [allocatedLegend];
            minPadding > 0 && self.legends.push(minPaddingLegend);

            // VPN
            self.minVPN = 0;
            self.maxVPN = organization.MaxVPN;

            self.sliderVPNOptions = {
                animate: false,
                start: defaultVPN,
                step: 1,
                connect: [true, false],
                tooltips: true,
                range: { min: self.minVPN, max: self.maxVPN },
                pips: {
                    mode: 'values',
                    values: [0, self.maxVPN],
                    density: self.maxVPN
                }
            };

            self.legendsVPN = [allocatedLegend];
            self.isLastStep = () => self.step === _.last(steps);

            self.next = () => {
                const promise = methods[index]().then(() => {
                    if (self.isLastStep()) {
                        return params.close();
                    }

                    index++;
                    $scope.$applyAsync(() => {
                        self.step = steps[index];
                    });
                });
                networkActivityTracker.track(promise);
            };

            function name() {
                const DisplayName = self.name;
                return organizationApi.updateOrganizationName({ DisplayName });
            }

            function keys() {
                const mailboxPassword = authentication.getPassword();
                const encryptionConfigName = self.size || self.encryptionConfigName;

                return setupKeys
                    .generateOrganization(mailboxPassword, encryptionConfigName)
                    .then(({ privateKeyArmored }) => {
                        payload.PrivateKey = privateKeyArmored;
                        return privateKeyArmored;
                    })
                    .then((armored) => decryptPrivateKey(armored, mailboxPassword))
                    .then((pkg) => (decryptedKey = pkg));
            }

            async function password() {
                const organizationPassword = self.organizationPassword;

                if (!organizationPassword) {
                    throw new Error(I18N.ERROR_PASSWORD_INPUT);
                }

                payload.Tokens = [];
                payload.BackupKeySalt = generateKeySalt();

                return computeKeyPassword(organizationPassword, payload.BackupKeySalt)
                    .then((keyPassword) => encryptPrivateKey(decryptedKey, keyPassword))
                    .then((armored) => (payload.BackupPrivateKey = armored))
                    .then(() => organizationApi.updateOrganizationKeys(payload));
            }

            function storage() {
                const memberID = params.memberID;
                const quota = Math.round(self.sliderValue * self.unit);

                return memberApi.quota(memberID, quota);
            }

            function vpn() {
                const memberID = params.memberID;
                const vpn = Math.round(self.sliderVPNValue);
                return memberApi.vpn(memberID, vpn);
            }
        }
    });
}
export default setupOrganizationModal;
