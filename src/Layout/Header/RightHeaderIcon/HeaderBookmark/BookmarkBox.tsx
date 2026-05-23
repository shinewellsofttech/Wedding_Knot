import { useAppDispatch, useAppSelector } from '../../../../ReduxToolkit/Hooks';
import { Col, Row } from 'reactstrap';
import { Link } from 'react-router-dom';
import { AddNewBookmark, Bookmark, Href } from '../../../../utils/Constant';
import { setFlip } from '../../../../ReduxToolkit/Reducers/LayoutSlice';
import { H6, LI, SVG, UL } from '../../../../AbstractElements';

const BookmarkBox = () => {
  const {bookmarkedData} = useAppSelector((state)=>state.bookmarkHeader)
  const dispatch = useAppDispatch();
  return (
    <div className="front">
      <H6 className="f-18 mb-0 dropdown-title">{Bookmark}</H6>
      <UL className="bookmark-dropdown">
        <LI className='custom-scrollbar'>
          <Row>
            {bookmarkedData.map((item, index) => (
              <Col xs="4" className="text-center" key={index}>
                <Link to={`${item.path}`}> 
                  <div className="bookmark-content">
                    <div className="bookmark-icon"> 
                      <SVG className="stroke-icon" iconId={`stroke-${item.icon}`}/>
                    </div>
                    <span>{item.title}</span>
                  </div>
                </Link>
              </Col>
            ))}
          </Row>
        </LI>
        <LI className="text-center" onClick={()=>dispatch(setFlip())}>
          <Link className="flip-btn f-w-700" id="flip-btn" to={Href}>{AddNewBookmark}</Link>
        </LI>
      </UL>
    </div>
  )
}

export default BookmarkBox