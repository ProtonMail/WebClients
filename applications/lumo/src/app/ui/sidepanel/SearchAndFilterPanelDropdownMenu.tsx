// import { useState } from 'react';

// import { c } from 'ttag';

// import { useModalState } from '@proton/components/index';
// import { useNotifications } from '@proton/components/index';

// import { useLumoNavigate } from '../../hooks/useLumoNavigate';
// // import { Icon } from '@proton/components/components';
// import { useLumoDispatch } from '../../redux/hooks';
// // import { TrashIcon } from '../../util/icons';
// import { deleteAllConversations } from '../../redux/slices/core/conversations';
// import DropdownMenu from '../components/DropdownMenu';
// import type { DropdownOptions } from '../components/DropdownMenu';
// import ConfirmDeleteModal from './ConfirmDeleteModal';

// const SearchAndFilterDropdownMenu = () => {
//     const dispatch = useLumoDispatch();
//     const navigate = useLumoNavigate();
//     const { createNotification } = useNotifications();
//     const [isDropdownOpen, setIsDropdownOpen] = useState(false);
//     const [modalProps, setOpen] = useModalState();
//     const { open, onClose } = modalProps;

//     const toggleDropdown = () => {
//         setIsDropdownOpen((prev) => !prev);
//     };

    // const openConfirmationModal = (e?: React.MouseEvent) => {
    //     e?.stopPropagation();
    //     setOpen(true);
    // };
    // const onDeleteAllConvos = async (e?: React.MouseEvent) => {
    //     e?.stopPropagation();
    //     setIsDropdownOpen(false);
//     const openConfirmationModal = () => {
//         setOpen(true);
//     };
//     const onDeleteAllConvos = async () => {
//         setIsDropdownOpen(false);

//         try {
//             await dispatch(deleteAllConversations());
//             createNotification({ text: c('Success').t`All conversations deleted` });
//         } catch (error) {
//             createNotification({ text: c('Fail').jt`${error}`, type: 'error' });
//         }

//         setOpen(false);

//         navigate(`/`);
//         // history.push(`/u/${sessionId}`);
//     };

//     const options: DropdownOptions[] = [
//         { label: c('Option').t`Delete all`, icon: 'trash', onClick: openConfirmationModal },
//     ];

//     return (
//         <>
//             <DropdownMenu options={options} onClick={toggleDropdown} isOpen={isDropdownOpen} />
//             {open && <ConfirmDeleteModal deleteAll handleClose={onClose} handleContinue={onDeleteAllConvos} />}
//         </>
//     );
// };

// export default SearchAndFilterDropdownMenu;
