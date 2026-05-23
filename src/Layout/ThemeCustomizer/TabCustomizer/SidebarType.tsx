import { H6, UL } from '../../../AbstractElements';
import { Sidebar_Type } from '../../../utils/Constant';
import Horizontal from './Horizontal';
import Vertical from './Vertical';

const SidebarType = () => {
    return (
      <div>
        <H6>{Sidebar_Type}</H6>
        <UL className="sidebar-type layout-grid simple-list flex-row">
          <Vertical />
          <Horizontal />
        </UL>
      </div>
    );
}

export default SidebarType