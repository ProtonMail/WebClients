import { useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Input } from '@proton/atoms';
import { AutocompleteList, Icon, Marks, Option, useAutocomplete, useAutocompleteFilter } from '@proton/components';
import { getIsSectionAvailable, getIsSubsectionAvailable } from '@proton/components/containers/layout/helper';
import type { IconName } from '@proton/icons/types';
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';

import type { getRoutes } from './routes';

type Routes = ReturnType<typeof getRoutes>;
type RouteParents = keyof Routes;

interface Props {
    routes: Routes;
    path: string;
    app: APP_NAMES;
}

interface SearchOption {
    value: string;
    icon: IconName;
    to: string;
    in: string[];
}

const getAppNameFromParentKey = (parentKey: RouteParents): APP_NAMES => {
    switch (parentKey) {
        case 'calendar':
            return APPS.PROTONCALENDAR;
        case 'mail':
            return APPS.PROTONMAIL;
        case 'drive':
            return APPS.PROTONDRIVE;
        case 'docs':
            return APPS.PROTONDOCS;
        case 'vpn':
            return APPS.PROTONVPN_SETTINGS;
        case 'pass':
            return APPS.PROTONPASS;
        case 'wallet':
            return APPS.PROTONWALLET;
        case 'meet':
            return APPS.PROTONMEET;
    }
    throw new Error('Unknown route');
};

const getSearchableItems = (routes: Routes, path: string, app: APP_NAMES): SearchOption[] => {
    return Object.entries(routes).flatMap(([key, parentRoute]) => {
        const parentKey = key as RouteParents;
        const parentApp =
            parentKey === 'account' || parentKey === 'organization' ? app : getAppNameFromParentKey(parentKey);

        if (parentRoute.available === false) {
            return [];
        }

        const prefix = `/${getSlugFromApp(parentApp)}`;

        return Object.values(parentRoute.routes).flatMap((sectionRoute) => {
            if (!getIsSectionAvailable(sectionRoute)) {
                return [];
            }

            const parentItem: SearchOption = {
                value: sectionRoute.text,
                in: [parentRoute.header],
                to: `${prefix}${sectionRoute.to}`,
                icon: sectionRoute.icon,
            };

            const subsectionItems: SearchOption[] = (sectionRoute.subsections || [])
                .map((subsection): SearchOption | null => {
                    if (!subsection.text || !getIsSubsectionAvailable(subsection)) {
                        return null;
                    }
                    return {
                        value: subsection.text,
                        in: [parentRoute.header, sectionRoute.text],
                        to: `${prefix}${sectionRoute.to}#${subsection.id}`,
                        icon: sectionRoute.icon,
                    };
                })
                .filter(isTruthy);

            return [parentItem, ...subsectionItems];
        });
    });
};

const getData = ({ value }: SearchOption) => value;

const SettingsSearch = ({ routes, path, app }: Props) => {
    const [value, setValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const history = useHistory();

    const options = getSearchableItems(routes, path, app);

    const filteredOptions = useAutocompleteFilter(value, options, getData, 20, 1);

    const handleOption = (option: SearchOption) => {
        history.push(option.to);
        setValue('');
    };

    const { onClose, getOptionID, inputProps, suggestionProps } = useAutocomplete({
        id: 'search-settings',
        options: filteredOptions,
        onSelect: (optionValue) => {
            handleOption(optionValue);
        },
        input: value,
        inputRef,
    });

    return (
        <>
            <div className="searchbox self-center my-auto">
                <Input
                    {...inputProps}
                    placeholder={
                        /** Translator: Translate as the action to search in the settings */
                        c('Action').t`Search settings`
                    }
                    prefix={<Icon name="magnifier" />}
                    className="pl-0"
                    ref={inputRef}
                    containerRef={containerRef}
                    value={value}
                    onChange={(event) => {
                        setValue(event.currentTarget.value.trimStart());
                    }}
                />
            </div>
            <AutocompleteList anchorRef={containerRef.current ? containerRef : inputRef} {...suggestionProps}>
                {filteredOptions.map(({ chunks, text, option }, index) => {
                    const parent = option.in.join(' > ');
                    return (
                        <Option
                            key={`${parent}-${text}-${option.to}`}
                            id={getOptionID(index)}
                            title={text}
                            value={option}
                            disableFocusOnActive
                            onChange={(optionValue) => {
                                handleOption(optionValue);
                                onClose();
                            }}
                        >
                            <div className="flex">
                                <div className="pr-4">
                                    <Icon name={option.icon} />
                                </div>
                                <div className="flex-1">
                                    <div>
                                        <Marks chunks={chunks}>{text}</Marks>
                                    </div>
                                    <div className="color-weak text-sm">{parent}</div>
                                </div>
                            </div>
                        </Option>
                    );
                })}
            </AutocompleteList>
        </>
    );
};

export default SettingsSearch;
