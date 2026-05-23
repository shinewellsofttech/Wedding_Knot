import { useAppDispatch } from '../../../ReduxToolkit/Hooks';
import { H6, UL } from '../../../AbstractElements';
import { Sidebar_Icon } from '../../../utils/Constant';
import StrokeIcon from './StrokeIcon';
import FillIcon from './FillIcon';
import { addSidebarIconType } from '../../../ReduxToolkit/Reducers/ThemeCustomizerSlice';

const SidebarIconType = () => {
    const dispatch = useAppDispatch();
    const handleSideBarIconType = (type: string) => {
      dispatch(addSidebarIconType(type));
      if(type === "stroke"){
        document.body.classList.add("stroke-svg")
        document.body.classList.remove("fill-svg")
      }else{
        document.body.classList.add("fill-svg")
        document.body.classList.remove("stroke-svg")
      }
    };
    return (
      <div>
        <H6>{Sidebar_Icon}</H6>
        <UL className="sidebar-type layout-grid flex-row simple-list">
          <StrokeIcon handleSideBarIconType={handleSideBarIconType}/>
          <FillIcon handleSideBarIconType={handleSideBarIconType}/>
        </UL>
      </div>
    );
}

export default SidebarIconType