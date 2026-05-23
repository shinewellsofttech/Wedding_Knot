import { H6, LI, UL } from "../../../AbstractElements";
import { lightColorData } from "../../../Data/LayoutData/ThemeCustomizerData";
import { useAppDispatch } from "../../../ReduxToolkit/Hooks";
import { setDarkMode } from "../../../ReduxToolkit/Reducers/LayoutSlice";
import { PropsLightColor } from "../../../Types/Layout/ThemeCustomizerTypes";
import { LightLayout } from "../../../utils/Constant";

const ColorLightLayout = () => {
  const dispatch = useAppDispatch()
  const handleColor = (data:PropsLightColor) => {
    dispatch(setDarkMode(false));
    document.documentElement.style.setProperty('--theme-default', data.primary);
    document.documentElement.style.setProperty('--theme-secondary', data.secondary);
  }
  return (
    <>
      <H6>{LightLayout}</H6>
      <UL className="layout-grid customizer-color flex-row">
        {lightColorData.map((data,i)=>(
          <LI className="color-layout" data-attr={`color-${i+1}`} data-primary={data.primary} onClick={()=>handleColor(data)} key={i}>
            <div></div>
          </LI>
        ))}
      </UL>
    </>
  );
};

export default ColorLightLayout;
