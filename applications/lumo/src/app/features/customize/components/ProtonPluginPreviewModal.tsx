import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';

import type { ProtonPlugin } from '../../skills/protonCatalog';
import { PluginExample, PluginIcon, getPluginMeta } from './ProtonPluginCard';

interface ProtonPluginPreviewModalProps extends ModalStateProps {
    plugin: ProtonPlugin;
    added: boolean;
    adding: boolean;
    onAdd: () => void;
    onOpen: () => void;
}

export const ProtonPluginPreviewModal = ({
    plugin,
    added,
    adding,
    onAdd,
    onOpen,
    ...modalProps
}: ProtonPluginPreviewModalProps) => (
    <ModalTwo size="large" {...modalProps}>
        <ModalTwoHeader title={plugin.getTitle()} subline={getPluginMeta(plugin)} />
        <ModalTwoContent>
            <div className="flex flex-nowrap items-start gap-3 mb-6">
                <PluginIcon plugin={plugin} large />
                <div className="flex flex-column flex-nowrap gap-2 min-w-0">
                    <p className="m-0">{plugin.getDescription()}</p>
                    <PluginExample plugin={plugin} />
                </div>
            </div>
            <h3 className="m-0 mb-1 text-sm text-semibold color-weak">{c('collider_2025:Title').t`Included skills`}</h3>
            <ul className="unstyled m-0 flex flex-column flex-nowrap">
                {plugin.skills.map((skill) => (
                    <li key={skill.name} className="py-3 border-top border-weak">
                        <span className="block text-semibold">/{skill.name}</span>
                        <span className="block text-sm color-weak">{skill.description}</span>
                    </li>
                ))}
            </ul>
        </ModalTwoContent>
        <ModalTwoFooter>
            <Button onClick={modalProps.onClose}>{c('collider_2025:Action').t`Close`}</Button>
            {added ? (
                <Button color="norm" onClick={onOpen}>
                    {c('collider_2025:Action').t`Open`}
                </Button>
            ) : (
                <Button color="norm" loading={adding} onClick={onAdd}>
                    {c('collider_2025:Action').t`Add`}
                </Button>
            )}
        </ModalTwoFooter>
    </ModalTwo>
);
