import { useState } from 'react';
import { useApi } from 'react-components';
import { c } from 'ttag';
import { GIGA } from 'proton-shared/lib/constants';
import { createMember, createMemberAddress } from 'proton-shared/lib/api/members';

const FIVE_GIGA = 5 * GIGA;

const useMemberModal = (organization, domains) => {
    const [model, updateModel] = useState({
        name: '',
        private: true,
        password: '',
        confirm: '',
        address: '',
        domain: '',
        vpn: 1,
        storage: FIVE_GIGA
    });
    const { request: requestCreateMember } = useApi(createMember);
    const { request: requestCreateMemberAddress } = useApi(createMemberAddress);
    const hasVPN = organization.MaxVPN;
    const update = (key, value) => updateModel({ ...model, [key]: value });

    const check = () => {
        if (!model.name.length) {
            throw new Error(c('Error').t`Invalid name`);
        }

        if (!model.private && model.password !== model.confirm) {
            throw new Error(c('Error').t`Invalid password`);
        }

        if (!model.address.length) {
            throw new Error(c('Error').t`Invalid address`);
        }

        const domain = domains.find(({ DomainName }) => DomainName === model.domain);
        const address = domain.addresses.find(({ Email }) => Email === `${model.address}@${model.domain}`);

        if (address) {
            throw new Error(c('Error').t`Address already associated to a user`);
        }

        // TODO
        // if (!member.Private && !organizationKey) {
        //     throw new Error(c('Error').t``);
        // }
    };

    const save = async () => {
        const { Member } = await requestCreateMember(
            {
                Name: model.name,
                Private: +model.private,
                MaxSpace: model.storage,
                MaxVPN: model.vpn
            },
            model.password
        ); // TODO handle password

        const { Address } = await requestCreateMemberAddress(Member.ID, {
            Local: model.address,
            Domain: model.domain
        });

        if (!model.Private) {
            // TODO generate key
            // TODO save encrypted key
            return Address;
        }
    };

    return {
        model,
        update,
        save,
        check,
        hasVPN
    };
};

export default useMemberModal;
