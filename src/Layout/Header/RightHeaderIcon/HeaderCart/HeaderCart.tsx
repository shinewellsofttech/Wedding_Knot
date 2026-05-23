import { H6, LI, SVG } from "../../../../AbstractElements";
import { Cart } from "../../../../utils/Constant";
import CartBox from "./CartBox";

const HeaderCart = () => {
  return (
    <LI className="cart-nav onhover-dropdown">
      <div className="cart-box">
        <SVG iconId='fill-Buy'/>
      </div>
      <div className="cart-dropdown onhover-show-div">
        <H6 className="f-18 mb-0 dropdown-title">{Cart}</H6>
        <CartBox />
      </div>
    </LI>
  );
};

export default HeaderCart;
