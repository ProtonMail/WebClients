import { MembersModel } from 'proton-shared/lib/models/membersModel';
import createUseModelHook from './helpers/createModelHook';
import { Member } from 'proton-shared/lib/interfaces';

export default createUseModelHook<Member[]>(MembersModel);
