import type {
    Item,
    ItemType,
    MaybeNull,
    Metadata,
    UnsafeItem,
    UnsafeItemContent,
    UnsafeItemExtraField,
} from '@proton/pass/types';
import { CardType, type PlatformSpecific } from '@proton/pass/types/protobuf/item-v1';
import { type ObjectHandler, objectHandler } from '@proton/pass/utils/object/handler';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

import { deobfuscateItem, obfuscateItem } from './item.obfuscation';

export const itemMetaFactory = (): ObjectHandler<Metadata> =>
    objectHandler({ name: '', note: '', itemUuid: uniqueId() });

export const itemContentBuilder = <T extends ItemType, R = ObjectHandler<UnsafeItemContent<T>>>(type: T): R => {
    switch (type) {
        case 'alias': {
            return objectHandler<UnsafeItemContent<'alias'>>({}) as R;
        }
        case 'creditCard': {
            return objectHandler<UnsafeItemContent<'creditCard'>>({
                cardholderName: '',
                cardType: CardType.Unspecified,
                number: '',
                verificationNumber: '',
                expirationDate: '',
                pin: '',
            }) as R;
        }
        case 'login': {
            return objectHandler<UnsafeItemContent<'login'>>({
                urls: [],
                passkeys: [],
                itemEmail: '',
                itemUsername: '',
                password: '',
                totpUri: '',
            }) as R;
        }
        case 'note': {
            return objectHandler<UnsafeItemContent<'note'>>({}) as R;
        }
        case 'identity': {
            return objectHandler<UnsafeItemContent<'identity'>>({
                fullName: '',
                email: '',
                phoneNumber: '',
                firstName: '',
                middleName: '',
                lastName: '',
                birthdate: '',
                gender: '',
                organization: '',
                streetAddress: '',
                zipOrPostalCode: '',
                city: '',
                stateOrProvince: '',
                countryOrRegion: '',
                floor: '',
                county: '',
                socialSecurityNumber: '',
                passportNumber: '',
                licenseNumber: '',
                website: '',
                xHandle: '',
                linkedin: '',
                reddit: '',
                facebook: '',
                yahoo: '',
                instagram: '',
                secondPhoneNumber: '',
                company: '',
                jobTitle: '',
                personalWebsite: '',
                workPhoneNumber: '',
                workEmail: '',
                extraAddressDetails: [],
                extraSections: [],
                extraContactDetails: [],
                extraWorkDetails: [],
                extraPersonalDetails: [],
            }) as R;
        }
    }

    throw new Error('unsupported item type');
};

type ItemBuilderInterface<T extends ItemType = ItemType> = {
    [K in T]: {
        type: K;
        content: ObjectHandler<UnsafeItemContent<K>>;
        metadata: ObjectHandler<Metadata>;
        extraFields: UnsafeItemExtraField[];
        platformSpecific?: PlatformSpecific;
    };
}[T];

export const itemBuilder = <T extends ItemType>(type: T, from?: Item<T>) => {
    const init = (from ? deobfuscateItem(from as Item) : null) as MaybeNull<UnsafeItem>;

    return objectHandler<ItemBuilderInterface<T>, Item<T>>(
        {
            type,
            content: itemContentBuilder<T>(type).merge(init?.content ?? {}),
            extraFields: init?.extraFields ?? [],
            metadata: itemMetaFactory().merge(init?.metadata ?? {}),
            platformSpecific: init?.platformSpecific,
        },
        (item) =>
            obfuscateItem<T>({
                ...item,
                content: item.content.data,
                metadata: item.metadata.data,
            } as UnsafeItem)
    );
};

export type ItemBuilder<T extends ItemType> = ObjectHandler<ItemBuilderInterface<T>, Item<T>>;
