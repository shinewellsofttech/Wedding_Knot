import { Col, Input } from "reactstrap";
import { LI, SVG, UL } from "../../../AbstractElements";
import { SearchCrocs } from "../../../utils/Constant";
import { ChangeEvent, useEffect, useState } from "react";
import { MenuItem, SearchSuggestionItem } from "../../../Types/Layout/SidebarType";
import ResponsiveSearchList from "./ResponsiveSearchList";
import { MenuList } from "../../../Data/LayoutData/SidebarData";

const SearchInput = () => {
  const [arr, setArr] = useState<SearchSuggestionItem[]>([]);
  const [searchedWord, setSearchedWord] = useState<string>("");
  const [searchedArray, setSearchedArray] = useState<SearchSuggestionItem[]>([]);

  useEffect(() => {
    const suggestionArray: SearchSuggestionItem[] = [];
    const getAllLink = (item: MenuItem, icon: string | undefined) => {
      if (item.children) {
        item.children.forEach((ele) => {
          getAllLink(ele, icon);
        });
      } else {
        suggestionArray.push({ icon: icon, title: item.title, path: item.path || "" });
      }
    };
    MenuList?.forEach((item) => {
      item.Items?.forEach((child) => {
        getAllLink(child, child.icon);
      });
    });
    setArr(suggestionArray);
  }, []);

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    if (!searchedWord) setSearchedWord("");
    setSearchedWord(e.target.value);
    let data = [...arr];
    let result = data.filter((item) => item.title?.toLowerCase().includes(e.target.value.toLowerCase()));
    setSearchedArray(result);
  };
  return (
    <Col xxl="5" md="3" className="left-header col-auto box-col-6 horizontal-wrapper p-0" >
      <div className="left-menu-header">
        <UL className="header-left simple-list">
          <LI>
            <div className="form-group w-100">
              <div className="Typeahead Typeahead--twitterUsers">
                <div className="u-posRelative d-flex"> 
                  <SVG className="search-bg svg-color me-2" iconId="fill-search" />
                  <Input className="demo-input Typeahead-input form-control-plaintext w-100 p-0" type="text"  placeholder={SearchCrocs} name="q" value={searchedWord} onChange={(e) => handleSearch(e)} />
                </div> 
                <div className={`Typeahead-menu custom-scrollbar ${searchedWord.length ? "is-open" : ""}`} > 
                  <ResponsiveSearchList searchedArray={searchedArray} setSearchedWord={setSearchedWord}/>
                </div>
              </div>
            </div>
          </LI>
        </UL>
      </div>
    </Col>
  );
};

export default SearchInput;
