import { H6, LI, UL } from "../../../AbstractElements";
import { darkColorData } from "../../../Data/LayoutData/ThemeCustomizerData";
import { useAppDispatch } from "../../../ReduxToolkit/Hooks";
import { setDarkMode } from "../../../ReduxToolkit/Reducers/LayoutSlice";
import { PropsLightColor } from "../../../Types/Layout/ThemeCustomizerTypes";
import { DarkLayout } from "../../../utils/Constant";

const ColorDarkLayout = () => {
    const dispatch = useAppDispatch()
    const handleColor = (data:PropsLightColor) => { 
      dispatch(setDarkMode(true));
      document.documentElement.style.setProperty('--theme-default', data.primary);
      document.documentElement.style.setProperty('--theme-secondary', data.secondary);
    }
  return (
    <>
      <H6>{DarkLayout}</H6>
      <UL className="layout-grid customizer-color flex-row dark">
        {darkColorData.map((data,i)=>(
          <LI className="color-layout" data-attr={`color-${i+1}`} data-primary={data.primary} onClick={()=>handleColor(data)} key={i}>
            <div></div>
          </LI>
        ))}
      </UL>
    </>
  )
}

export default ColorDarkLayout