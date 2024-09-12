import { Tabs } from '@proton/components';
import { Audience } from '@proton/shared/lib/interfaces';

import type { SignupConfiguration } from './interface';

const map = {
    [Audience.B2C]: 0,
    [Audience.B2B]: 1,
    [Audience.FAMILY]: 2,
};
const reverseMap = {
    0: Audience.B2C,
    1: Audience.B2B,
    2: Audience.FAMILY,
};

const AudienceTabs = ({
    audience,
    audiences,
    onChangeAudience,
}: {
    audience: SignupConfiguration['audience'];
    audiences: SignupConfiguration['audiences'];
    onChangeAudience: (value: NonNullable<SignupConfiguration['audiences']>[0]) => void;
}) => {
    if (audiences === undefined || audience === undefined) {
        return null;
    }
    const tabs = audiences.map(({ value, title }) => ({
        title,
        value,
    }));
    return (
        <Tabs
            containerClassName="border-none text-sm md:text-rg"
            value={map[audience]}
            onChange={(value) => {
                const newAudience = reverseMap[value as unknown as keyof typeof reverseMap];
                const newValue = audiences.find(({ value }) => value === newAudience);
                if (newValue) {
                    onChangeAudience(newValue);
                }
            }}
            tabs={tabs}
        />
    );
};

export default AudienceTabs;
