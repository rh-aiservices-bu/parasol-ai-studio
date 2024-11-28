import { AppState } from '~/redux/types';
import { useAppSelector } from '~/redux/hooks';
import { isStateEqual } from '~/redux/selectors/utils';
import { ModeState } from './types';

const getMode = (state: AppState): ModeState => ({
  isEasyMode: !!state.isEasyMode,
});

export const useMode = (): ModeState => useAppSelector(getMode, isStateEqual);
