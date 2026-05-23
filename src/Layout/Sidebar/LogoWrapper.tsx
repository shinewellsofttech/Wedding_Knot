import { Link } from 'react-router-dom';
import { useAppSelector } from '../../ReduxToolkit/Hooks';
import { Image, H6 } from '../../AbstractElements';
import { dynamicImage } from '../../Service';
import { Crocs } from '../../utils/Constant';

const LogoWrapper = () => {
    return (
      <>
        <div className="logo-wrapper">
          <Link to={`${process.env.PUBLIC_URL}/dashboard/default`} className="text-decoration-none">
            <div className="d-flex align-items-center gap-2">
              <Image className="img-fluid" src={dynamicImage("logo/logo-icon.png")} alt="logo" style={{width: 25, height: 25}} />
              <H6 className="mb-0 text-uppercase fw-bold text-primary mb-0" style={{letterSpacing: "0.5px", fontSize: "18px",lineHeight: "1.2"}}>{Crocs}</H6>
            </div>
          </Link>
        </div>
        <div className="logo-icon-wrapper">
          <Link to={`${process.env.PUBLIC_URL}/dashboard/default`}>
            <Image className="img-fluid" src={dynamicImage("logo/logo-icon.png")} alt="logo" />
          </Link>
        </div>
      </>
    );
}

export default LogoWrapper