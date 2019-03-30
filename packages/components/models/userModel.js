import { UserModel } from 'proton-shared/lib/models/userModel';
import createUseModelHook from './helpers/createModelHook';

export const useUser = createUseModelHook(UserModel);
