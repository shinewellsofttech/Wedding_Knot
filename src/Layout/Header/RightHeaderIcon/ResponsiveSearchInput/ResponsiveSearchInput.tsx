/* eslint-disable react-hooks/exhaustive-deps */
import { Input } from "reactstrap";
import { SearchCrocs } from "../../../../utils/Constant";
import { ChangeEvent, useEffect, useState } from "react";
import { MenuItem, SearchSuggestionItem } from "../../../../Types/Layout/SidebarType";
import { LI, SVG } from "../../../../AbstractElements";
import SearchSuggestionList from "./SearchSuggestionList";
import { setResponsiveSearch } from "../../../../ReduxToolkit/Reducers/LayoutSlice";
import { useAppDispatch } from "../../../../ReduxToolkit/Hooks";
import { MenuList } from "../../../../Data/LayoutData/SidebarData";
import { getLinkItemsArray } from "../../../../ReduxToolkit/Reducers/BookmarkHeaderSlice";

const ResponsiveSearchInput = () => {
  const [arr, setArr] = useState<SearchSuggestionItem[]>([]);
  const [searchedWord, setSearchedWord] = useState<string>("");
  const[open,setOpen] = useState(false)
  const [searchedArray, setSearchedArray] = useState<SearchSuggestionItem[]>([]);
  const dispatch = useAppDispatch()

  useEffect(() => {
    const suggestionArray: SearchSuggestionItem[] = [];
    let num = 0;
    const getAllLink = (item: MenuItem, icon: string | undefined) => {
      if (item.children) {
        item.children.forEach((ele) => {
          getAllLink(ele, icon);
        });
      } else {
        num = num + 1;
        suggestionArray.push({ icon: icon, title: item.title, path: item.path ? item.path : '' , bookmarked: false, id: num });
      }
    };
    MenuList?.forEach((item) => {
      item.Items?.forEach((child) => {
        getAllLink(child, child.icon);
      });
    });
    setArr(suggestionArray);
    dispatch(getLinkItemsArray(suggestionArray));
  }, []);

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    if (!searchedWord) setSearchedWord("");
    setSearchedWord(e.target.value);
    let result = arr.filter((item) =>item.title?.toLowerCase().includes(e.target.value.toLowerCase()));
    setSearchedArray(result);
  };

  return (
    <>
      <LI onClick={()=>dispatch(setResponsiveSearch())} className="serchinput">
        <div className="searchbox" onClick={()=>setOpen(!open)}>
          <SVG iconId="fill-search"/>
        </div>
        <div className={`form-group search-form ${open ? "open" : ""}`}>
          <Input type="text" placeholder={SearchCrocs} name="q" onChange={(e) => handleSearch(e)} value={searchedWord} />
          <div className={`Typeahead-menu w-100 custom-scrollbar ${searchedWord.length ? "is-open" : ""}`}>
            <SearchSuggestionList searchedArray={searchedArray} setSearchedWord={setSearchedWord}/>
          </div>
        </div>
      </LI> 
    </>
  );
};

export default ResponsiveSearchInput;
