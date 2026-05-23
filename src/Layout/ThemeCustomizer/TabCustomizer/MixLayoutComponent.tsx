import { useAppDispatch } from '../../../ReduxToolkit/Hooks';
import { H6, UL } from '../../../AbstractElements';
import { Mix_Layout } from '../../../utils/Constant';
import BgLight from './BgLight';
import BgDark from './BgDark';
import ConfigDB from '../../../Config/ThemeConfig';
import { setMixBackgroundLayout } from '../../../ReduxToolkit/Reducers/ThemeCustomizerSlice';

const MixLayoutComponent = () => {
    const dispatch = useAppDispatch();
    const mixLayout = ConfigDB.data.color.mix_background_layout;
  
    const addMixBackgroundLayout = (mix_background_layout: string) => {
      ConfigDB.data.color.mix_background_layout = mix_background_layout;
      dispatch(setMixBackgroundLayout(mix_background_layout));
    };
  
    const handleCustomizerMix_Background = (value: string) => {
      addMixBackgroundLayout(value);
      if (value === "dark-sidebar") {
        document.body.classList.add("dark-sidebar");
        document.body.classList.remove("dark-only");
      } else if (value === "dark-only") {
        document.body.classList.remove("dark-sidebar");
        document.body.classList.add("dark-only");
      }
    };
    return (
      <>
        <H6>{Mix_Layout}</H6>
        <UL className="layout-grid customizer-mix flex-row simple-list">
          <BgLight mixLayout={mixLayout} handleCustomizerMix_Background={handleCustomizerMix_Background}/>
          <BgDark mixLayout={mixLayout} handleCustomizerMix_Background={handleCustomizerMix_Background}/>
        </UL>
      </>
    );
}

export default MixLayoutComponent