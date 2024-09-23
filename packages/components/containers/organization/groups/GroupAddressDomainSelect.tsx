import { useCallback } from 'react';

import { usePopperAnchor } from '@proton/components';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import Icon from '@proton/components/components/icon/Icon';
import useModalState from '@proton/components/components/modalTwo/useModalState';
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
            className="text-left flex items-center flex-nowrap gap-4"
            key={option.value}
            onClick={handleClick}
        >
            <span className="overflow-x-auto">{option.label}</span>
            {isSelected ? (
                <Icon className="color-primary shrink-0" name="checkmark" data-testid="selected-domain" />
            ) : null}
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
            <Dropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                size={{ width: DropdownSizeUnit.Dynamic, height: DropdownSizeUnit.Dynamic }}
            >
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
