// import {StyleSheet} from 'react-native';
import COLORS from '../../constants/constColors';

export const spinnerStyle = StyleSheet.create({
  MainViewContainer: {
    flex: 1,
  },
  ActivityIndicatorViewContainer: {
    backgroundColor: COLORS.BLACK,
    height: '100%',
    width: '100%',
    opacity: 0.7,
    alignItems: 'center',
    justifyContent: 'space-around',
    zIndex: 999999,
    position: 'absolute',
  },
});
