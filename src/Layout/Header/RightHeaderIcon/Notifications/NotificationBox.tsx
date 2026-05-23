import { Link } from "react-router-dom"
import { H5, Image } from "../../../../AbstractElements"
import { notificationData } from "../../../../Data/LayoutData/HeaderData"
import { dynamicImage } from "../../../../Service"

const NotificationBox = () => {
  return (
    <>
        {notificationData.map((data, index) => (
            <div className="d-flex align-items-center" key={index}>
                <Image src={dynamicImage(`dashboard/user/${data.img}`)} alt="Wallet" />
                <div className="flex-grow-1 ms-2">
                    <Link to={`${process.env.PUBLIC_URL}/users/userprofile`}>
                        <H5>{data.title}</H5>
                        <span>{data.subTitle}</span>
                    </Link>
                </div>
                {data.color && 
                    <div className="flex-shrink-0"> 
                        <div className={`activity-dot-${data.color}`}></div>
                    </div>
                }
            </div>
        ))}
    </>
  )
}

export default NotificationBox