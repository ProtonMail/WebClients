angular.module('proton.core')
.factory('aliasModal', (pmModal, Address, networkActivityTracker, notify) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/alias.tpl.html',
        controller(params) {
            // Variables
            this.local = '';
            this.members = params.members;
            this.member = params.members[0]; // TODO in the future we should add a select to choose a member
            this.domains = [];

            _.each(params.domains, (domain) => {
                this.domains.push({ label: domain, value: domain });
            });

            this.domain = this.domains[0];

            // Functions
            this.add = function () {
                networkActivityTracker.track(
                    Address.create({
                        Local: this.local,
                        Domain: this.domain.value,
                        MemberID: this.member.ID
                    })
                    .then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            params.add(result.data.Address);
                        } else if (result.data && result.data.Error) {
                            notify({ message: result.data.Error, classes: 'notification-danger' });
                        }
                    })
                );
            }.bind(this);

            this.cancel = function () {
                params.cancel();
            };
        }
    });
});
