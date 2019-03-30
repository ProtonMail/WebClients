import { MembersModel } from 'proton-shared/lib/models/membersModel';
import createUseModelHook from './helpers/createModelHook';

export const useMembers = createUseModelHook(MembersModel);
