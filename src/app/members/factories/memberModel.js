angular.module('proton.members')
.factory('memberModel', ($rootScope, memberApi) => {
    let members = [];
    function get() {
        return members;
    }
    function set(newMembers) {
        members = newMembers;
    }
    function fetch() {
        return memberApi.query()
        .then(({ data = {} } = {}) => {
            if (data.Code === 1000) {
                members = data.Members;
                return data.Members;
            }
            throw new Error(data.Error || 'Member request failed');
        });
    }
    function clear() {
        members = [];
    }
    $rootScope.$on('deleteMember', (event, ID) => {
        const index = _.findIndex(members, { ID });

        if (index > -1) {
            members.splice(index, 1);
            $rootScope.$emit('membersChange', members);
        }
    });
    $rootScope.$on('createMember', (event, ID, member) => {
        const index = _.findIndex(members, { ID });

        if (index === -1) {
            members.push(member);
        } else {
            _.extend(members[index], member);
        }
        $rootScope.$emit('membersChange', members);
    });
    $rootScope.$on('updateMember', (event, ID, member) => {
        const index = _.findIndex(members, { ID });

        if (index === -1) {
            members.push(member);
        } else {
            _.extend(members[index], member);
        }
        $rootScope.$emit('membersChange', members);
    });
    return { get, set, fetch, clear };
});
