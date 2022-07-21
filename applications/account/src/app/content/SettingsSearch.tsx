import { c } from 'ttag';
import { useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
    AutocompleteList,
    Icon,
    IconName,
    InputTwo,
    Marks,
    Option,
    useAutocomplete,
    useAutocompleteFilter,
} from '@proton/components';
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { APP_NAMES, APPS } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';
import { getIsSectionAvailable, getIsSubsectionAvailable } from '@proton/components/containers/layout/helper';

import { getRoutes } from './routes';

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
        case 'vpn':
            return APPS.PROTONVPN_SETTINGS;
    }
    throw new Error('Unknown route');
};

const getSearchableItems = (routes: Routes, path: string, app: APP_NAMES): SearchOption[] => {
    return Object.entries(routes).flatMap(([key, parentRoute]) => {
        const parentKey = key as RouteParents;
        const parentApp =
            parentKey === 'account' || parentKey === 'organization' ? app : getAppNameFromParentKey(parentKey);

        // Only interested in account, organization, or app-level settings
        if (parentApp !== app) {
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

            const subsectionItems: SearchOption[] = sectionRoute.subsections
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
            <div className="w35 flex-item-centered-vert">
                <InputTwo
                    {...inputProps}
                    placeholder={c('Placeholder').t`Search settings`}
                    prefix={<Icon name="magnifier" alt={c('Action').t`Search settings`} />}
                    className="pl0"
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
                    return (
                        <Option
                            key={text}
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
                                <div className="pr1">
                                    <Icon name={option.icon} />
                                </div>
                                <div className="flex-item-fluid">
                                    <div>
                                        <Marks chunks={chunks}>{text}</Marks>
                                    </div>
                                    <div className="color-weak text-sm">{option.in.join(' > ')}</div>
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
