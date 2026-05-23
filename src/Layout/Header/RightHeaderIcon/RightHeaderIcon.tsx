import { Col } from 'reactstrap'
import { UL } from '../../../AbstractElements'
import ResponsiveSearchInput from './ResponsiveSearchInput/ResponsiveSearchInput'
import HeaderFYCompany from '../HeaderFYCompany'
import ZoomInOut from './ZoomInOut/ZoomInOut'
// import Language from './Language/Language'
// import Notifications from './Notifications/Notifications'
// import HeaderBookmark from './HeaderBookmark/HeaderBookmark'
import DarkMode from './DarkMode/DarkMode'
// import HeaderMessage from './HeaderMessage/HeaderMessage'
// import HeaderCart from './HeaderCart/HeaderCart'
import UserProfile from './UserProfile/UserProfile'
import ThemeCustomizerToggle from './ThemeCustomizerToggle/ThemeCustomizerToggle'

const RightHeaderIcon = () => {
  return (
    <Col xxl="7" xl="8" className="nav-right col-auto box-col-6 pull-right right-header p-0 ms-auto">
      <UL className="nav-menus flex-row">
        <HeaderFYCompany />
        <ResponsiveSearchInput />
        <ZoomInOut />
        {/* <Language /> */}
        {/* <Notifications /> */}
        {/* <HeaderBookmark /> */}
        <DarkMode />
        {/* <HeaderMessage /> */}
        {/* <HeaderCart /> */}
        <ThemeCustomizerToggle />
        
        <UserProfile />
        
      </UL>
    </Col>
  )
}

export default RightHeaderIcon