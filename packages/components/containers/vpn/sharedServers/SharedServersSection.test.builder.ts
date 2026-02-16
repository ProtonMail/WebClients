import { PolicyState, PolicyType } from './constants';

type MockLocation = { Country: string; City: string };
type MockTranslations = { refresh: jest.Mock; cities: Record<string, Record<string, null>> };
type MockUser = { UserID: string; Email: string; Name: string };
type MockPolicy = { State: PolicyState; Type: PolicyType; Groups: []; Users: MockUser[]; Locations: MockLocation[] };
type MockState = {
    loading: boolean;
    policies: MockPolicy[];
    locations: MockLocation[];
    translations: MockTranslations;
    users: MockUser[];
    groups: any[];
    refresh: jest.Mock;
    countUsersNotInAnyPolicy: number;
};

export class SharedServersBuilder {
    private state: MockState = {
        loading: false,
        policies: [],
        locations: [],
        translations: {
            refresh: jest.fn(),
            cities: {},
        },
        users: [],
        groups: [],
        refresh: jest.fn(),
        countUsersNotInAnyPolicy: 0,
    };

    withoutPolicies() {
        this.state.policies = [];

        return this;
    }

    withDenyPolicy() {
        this.state.policies.push({
            State: PolicyState.Active,
            Type: PolicyType.None,
            Groups: [],
            Users: [],
            Locations: [],
        });

        return this;
    }

    withAllowAllPolicy() {
        this.state.policies.push({
            State: PolicyState.Active,
            Type: PolicyType.All,
            Groups: [],
            Users: [],
            Locations: [],
        });

        return this;
    }

    withCustomPolicy() {
        this.state.policies.push({
            State: PolicyState.Active,
            Type: PolicyType.Custom,
            Groups: [],
            Users: [],
            Locations: [],
        });
        return this;
    }

    withLocations(locations: number | MockLocation[]) {
        if (typeof locations === 'number') {
            const items: MockLocation[] = Array.from({ length: locations }, (_, i) => ({
                Country: `AE_${i}`,
                City: `Dubai_${i}`,
            }));
            this.withLocations(items);
        } else {
            this.state.locations.push(...locations);
            locations.forEach((loc) => {
                this.state.translations.cities[loc.Country] = { [loc.City]: null };
            });
        }
        return this;
    }

    withUsers(users: number | MockUser[]) {
        if (typeof users === 'number') {
            const items: MockUser[] = Array.from({ length: users }, (_, i) => ({
                UserID: `${i}`,
                Email: `user_${i}@proton.ch`,
                Name: `user_${i}`,
            }));
            this.withUsers(items);
        } else {
            this.state.users = users;
        }
        return this;
    }

    build(): MockState {
        return this.state;
    }
}
