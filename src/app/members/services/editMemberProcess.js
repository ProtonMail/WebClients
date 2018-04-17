import _ from 'lodash';

/* @ngInject */
function editMemberProcess(
    networkActivityTracker,
    gettextCatalog,
    memberApi,
    Address,
    setupKeys,
    membersValidator,
    notification,
    eventManager
) {
    const I18N = {
        SUCCESS_UPDATE: gettextCatalog.getString('User updated', null, 'Info'),
        SUCCESS_CREATE: gettextCatalog.getString('User created', null, 'Info')
    };

    /**
     * Edit a member
     * @param  {Object} model                 Controller instance with the data
     * @param  {Object} options.params        Params from the modal
     * @param  {Number} options.maxPadding
     * @param  {Number} options.minPadding
     * @param  {Number} options.maxVPNPadding
     * @return {Object}
     */
    const editProcess = (model, { params, maxPadding, minPadding, maxVPNPadding }) => {
        const {
            storageSliderValue,
            temporaryPassword,
            organizationKey,
            vpnSliderValue,
            oldMember,
            address,
            domain,
            unit,
            name,
            hasVPN,
            size,
            ID
        } = model;

        const quota = Math.round(storageSliderValue * unit);
        const vpn = Math.round(vpnSliderValue);

        const updateName = (member) => {
            if (oldMember && oldMember.Name === name) {
                return member;
            }
            return memberApi.name(member.ID, name).then(() => ((member.Name = name), member));
        };

        const updateQuota = (member) => {
            if (oldMember && oldMember.MaxSpace === quota) {
                return member;
            }
            return memberApi.quota(member.ID, quota).then(() => ((member.MaxSpace = quota), member));
        };

        const updateVPN = (member) => {
            if (!hasVPN || (oldMember && oldMember.MaxVPN === vpn)) {
                return member;
            }
            return memberApi.vpn(member.ID, vpn).then(() => ((member.MaxVPN = vpn), member));
        };

        const memberRequest = (member) => {
            return memberApi.create(member, temporaryPassword).then((data = {}) => data.Member);
        };

        const addressRequest = async (member) => {
            if (params.member && params.member.Addresses.length) {
                return { addresses: params.member.Addresses, member };
            }

            const data = await Address.create({
                Local: address,
                Domain: domain.DomainName,
                MemberID: member.ID
            });
            member.Addresses.push(data.Address);
            return { addresses: [data.Address], member };
        };

        const generateKey = async ({ member, addresses }) => {
            if (member.Private || (params.member && params.member.Keys.length > 0)) {
                return { member };
            }
            const list = !addresses.length ? params.member.Addresses : addresses;
            const key = await setupKeys.generate(list, temporaryPassword, size);
            return { member, key };
        };

        const keyRequest = async ({ member, key }) => {
            if (member.Private || (params.member && params.member.Keys.length > 0)) {
                return { member };
            }
            await setupKeys.memberSetup(key, temporaryPassword, member.ID, organizationKey);
            return { member };
        };

        /**
         * Get the promise to create or edit a member
         * @param  {Object} config Config from the slider
         * @param  {Object} member
         * @return {Object}        { message:String, promise:Function }
         */
        const getPromise = (config, member) => {
            const wrapper = () => {
                return membersValidator.check({ member, params, quota, vpn, config }, model).then(() => member);
            };

            if (ID) {
                member.ID = ID;
                return {
                    message: I18N.SUCCESS_UPDATE,
                    promise() {
                        return wrapper()
                            .then(updateName)
                            .then(updateQuota)
                            .then(updateVPN)
                            .then(() => member);
                    }
                };
            }

            return {
                message: I18N.SUCCESS_CREATE,
                promise() {
                    return wrapper().then(memberRequest);
                }
            };
        };

        const edit = () => {
            const member = _.extend({}, params.member, {
                Name: name,
                Private: +!!model.private,
                MaxSpace: quota,
                MaxVPN: vpn
            });

            const { message, promise } = getPromise({ maxPadding, minPadding, maxVPNPadding }, member);

            const finish = (message) => ({ member }) => {
                params.submit(member);
                return eventManager.call().then(() => notification.success(message));
            };

            const process = promise()
                .then(addressRequest)
                .then(generateKey)
                .then(keyRequest)
                .then(finish(message))
                .catch((error) => {
                    eventManager.call();
                    throw error;
                });
            networkActivityTracker.track(process);
        };

        return { edit };
    };

    return editProcess;
}
export default editMemberProcess;
