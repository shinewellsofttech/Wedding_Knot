import { ChangeEvent, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../../../ReduxToolkit/Hooks';
import { BookmarkedDataType } from '../../../../Types/Layout/SidebarType';
import { setFlip } from '../../../../ReduxToolkit/Reducers/LayoutSlice';
import { Input } from 'reactstrap';
import { LI, P, SVG, UL } from '../../../../AbstractElements';
import { Link } from 'react-router-dom';
import { Back, Href } from '../../../../utils/Constant';
import { handleBookmarkChange } from '../../../../ReduxToolkit/Reducers/BookmarkHeaderSlice';

const BookmarkBack = () => {
  const dispatch = useAppDispatch();
  const { sidebarIconType } = useAppSelector((state) => state.themeCustomizer)
  const { linkItemsArray } = useAppSelector((store) => store.bookmarkHeader);
  const [searchedItems, setSearchedItems] = useState<(BookmarkedDataType)[]>([]);
  const [searchWord, setSearchWord] = useState("");

  const searchItems = (e: string) => {
    let copyArray = [...linkItemsArray];
    let result = copyArray.filter((item, i) => item.title?.toLowerCase().includes(e.toLowerCase()));
    setSearchedItems(result);
  };

  const handleBackButton = () => {
    dispatch(setFlip())
    setSearchWord("");
  };

  const bookMarkInputChange=(e:ChangeEvent<HTMLInputElement>)=>{
    setSearchWord(e.target.value);
    searchItems(e.target.value);
  }
  return (
    <div className="back">
      <UL>
        <LI>
          <div className="bookmark-dropdown flip-back-content">
            <Input type="text" placeholder="search..." onChange={(e) => bookMarkInputChange(e)} value={searchWord}/>
          </div>
          <div className={`filled-bookmark Typeahead-menu  ${searchWord ? "is-open" : ""} custom-scrollbar`}>
            {searchedItems?.map((item:any, i:number) => (
              <div key={i} className="ProfileCard u-cf">
                <div className="ProfileCard-avatar">
                  <SVG className={`${sidebarIconType}-icon`} iconId={`${sidebarIconType}-${item.icon}`}/>
                </div>
                <div className="ProfileCard-details">
                  <div className="ProfileCard-realName">
                    <Link className="realname" to={Href}>{item.title}</Link>
                    <span className="pull-right">
                      <Link to={Href}>
                        <i onClick={() => dispatch(handleBookmarkChange(linkItemsArray[item.id - 1]))} className={`fa fa-star-o mt-1 icon-star ${linkItemsArray[item.id - 1].bookmarked ? "starred" : ""}`}></i>
                      </Link>
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {!searchedItems.length && <P> Opps!! There are no result found.</P> }
          </div>
        </LI>
        <LI onClick={handleBackButton}>
          <Link className="f-w-700 d-block flip-back" to={Href}>{Back}</Link>
        </LI>
      </UL>
    </div>
  )
}

export default BookmarkBack