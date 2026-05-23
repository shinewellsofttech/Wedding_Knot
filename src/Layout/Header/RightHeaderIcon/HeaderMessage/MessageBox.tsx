import { Link } from "react-router-dom";
import { FeatherIcons, H5, Image, LI, P, UL } from "../../../../AbstractElements";
import { dynamicImage } from "../../../../Service";
import { CheckAll, Href } from "../../../../utils/Constant";
import { messageData } from "../../../../Data/LayoutData/HeaderData";

const MessageBox = () => {
  return (
    <UL className="simple-list">
        {messageData.map((data,index) => (
            <LI key={index}>
                <div className="d-flex align-items-start">
                    <div className="message-img bg-light-primary">
                        <Image src={dynamicImage(`user/${data.img}`)} alt="Graph" />
                    </div>
                    <div className="flex-grow-1">
                        <H5 className="mb-1">
                            <Link to={Href}>{data.userName}</Link>
                        </H5>
                        <P>{data.statusClass}</P>
                    </div>
                    <div className="notification-right">
                        <FeatherIcons iconName="X" />
                    </div>
                </div>
            </LI>
        ))}
        <LI>
            <Link className="f-w-700" to={"/crocs/email/letterbox"}>{CheckAll}</Link>
        </LI>
    </UL>
  );
};

export default MessageBox;
