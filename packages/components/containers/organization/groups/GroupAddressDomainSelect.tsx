import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';

import Dropdown from '../../../components/dropdown/Dropdown';
import DropdownButton from '../../../components/dropdown/DropdownButton';
import DropdownMenu from '../../../components/dropdown/DropdownMenu';
import DropdownMenuButton from '../../../components/dropdown/DropdownMenuButton';
import { DropdownSizeUnit } from '../../../components/dropdown/utils';
import useModalState from '../../../components/modalTwo/useModalState';
import AddSubdomainModal from './AddSubdomainModal';
import useGroupAvailableAddressDomains from './hooks/useGroupAvailableAddressDomains';
import type { DomainSuggestion } from './types';

const Option = ({
    suggestion,
    isSelected,
    onSelect,
}: {
    suggestion: DomainSuggestion;
    isSelected?: boolean;
    onSelect: (value: string) => void;
}) => {
    return (
        <DropdownMenuButton
            className="text-left flex items-center flex-nowrap gap-4"
            key={suggestion.domain}
            onClick={() => onSelect(suggestion.domain!)}
        >
            <span className="text-ellipsis inline-block" title={`@${suggestion.domain}`}>
                {`@${suggestion.domain}`}
            </span>
            {isSelected ? <IcCheckmark className="color-primary shrink-0" data-testid="selected-domain" /> : null}
        </DropdownMenuButton>
    );
};

interface Props {
    selectedDomain: string;
    onChange: (value: string) => void;
    setSelectedDomain: (domain: string) => void;
    disabled?: boolean;
}

const GroupAddressDomainSelect = ({ selectedDomain, setSelectedDomain, onChange, disabled }: Props) => {
    const { allSuggestions, primarySuggestion, pmMeDomain } = useGroupAvailableAddressDomains();
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    // setAddSubdomainModal is removed for now until add pm.me domain option can be supported
    const [addSubdomainModal, , renderAddSubdomainModal] = useModalState();

    return (
        <>
            {renderAddSubdomainModal && pmMeDomain && (
                <AddSubdomainModal
                    prefilledDomainName={primarySuggestion.domain ?? ''}
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
                <span className="inline-block text-ellipsis" title={`@${selectedDomain}`}>{`@${selectedDomain}`}</span>
            </DropdownButton>
            <Dropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                size={{ width: DropdownSizeUnit.Dynamic, height: DropdownSizeUnit.Dynamic }}
            >
                <DropdownMenu>
                    {allSuggestions.map((s) => (
                        <Option
                            key={s.domain}
                            suggestion={s}
                            isSelected={s.domain === selectedDomain}
                            onSelect={onChange}
                        />
                    ))}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

export default GroupAddressDomainSelect;
