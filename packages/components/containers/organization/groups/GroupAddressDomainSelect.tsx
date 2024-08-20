import React, { useCallback } from 'react';

import {
    Dropdown,
    DropdownButton,
    DropdownMenu,
    DropdownMenuButton,
    Icon,
    useModalState,
    usePopperAnchor,
} from '@proton/components/index';
import type { Domain } from '@proton/shared/lib/interfaces';

import AddSubdomainModal from './AddSubdomainModal';
import usePmMeDomain from './usePmMeDomain';

interface DomainOption {
    label: string;
    value: string;
}

const Option = ({
    option,
    isSelected,
    onSelect,
}: {
    option: DomainOption;
    isSelected?: boolean;
    onSelect: (value: string) => void;
}) => {
    const handleClick = useCallback(() => {
        onSelect(option.value);
    }, [option]);
    return (
        <DropdownMenuButton
            className="text-left flex justify-space-between items-center"
            key={option.value}
            onClick={handleClick}
        >
            <span className="flex items-center mr-14">{option.label}</span>
            {isSelected ? <Icon className="color-primary" name="checkmark" data-testid="selected-domain" /> : null}
        </DropdownMenuButton>
    );
};

interface Props {
    domains: Domain[] | undefined;
    selectedDomain: string;
    suggestedDomainName: string;
    onChange: (value: string) => void;
    setSelectedDomain: (domain: string) => void;
    disabled?: boolean;
}

const GroupAddressDomainSelect = ({
    domains: domainsArg = [],
    selectedDomain,
    suggestedDomainName,
    setSelectedDomain,
    onChange,
    disabled,
}: Props) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    // setAddSubdomainModal is removed for now until add pm.me domain option can be supported
    const [addSubdomainModal, , renderAddSubdomainModal] = useModalState();
    const pmMeDomain = usePmMeDomain();

    if (pmMeDomain === null) {
        return null;
    }

    const defaultDomain = { DomainName: `${suggestedDomainName}${pmMeDomain}` };
    const domains = domainsArg.length > 0 ? domainsArg : [defaultDomain];
    const domainOptions: DomainOption[] = domains.map((domain) => ({
        label: `@${domain.DomainName}`,
        value: domain.DomainName,
    }));

    const handleChange = (value: string) => {
        onChange(value);
    };

    return (
        <>
            {renderAddSubdomainModal && (
                <AddSubdomainModal
                    prefilledDomainName={suggestedDomainName}
                    setSelectedDomain={setSelectedDomain}
                    pmMeDomain={pmMeDomain}
                    {...addSubdomainModal}
                />
            )}
            <DropdownButton
                className="self-center"
                ref={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
                hasCaret
                shape="ghost"
                size="small"
                disabled={disabled}
            >
                {`@${selectedDomain}`}
            </DropdownButton>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <DropdownMenu>
                    {domainOptions.map((option) => (
                        <Option
                            key={option.value}
                            option={option}
                            isSelected={option.value === selectedDomain}
                            onSelect={handleChange}
                        />
                    ))}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

export default GroupAddressDomainSelect;
