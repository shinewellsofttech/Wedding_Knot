import { combineReducers } from "redux";

// Front
import Layout from "./layout/reducer";

// Authentication
import Login from "./auth/login/reducer";
import Account from "./auth/register/reducer";
import ForgetPassword from "./auth/forgetpwd/reducer";
import Profile from "./auth/profile/reducer";

// ReduxToolkit Slices
import LayoutSlice from "../ReduxToolkit/Reducers/LayoutSlice";
import BookmarkHeaderSlice from "../ReduxToolkit/Reducers/BookmarkHeaderSlice";
import ThemeCustomizerSlice from "../ReduxToolkit/Reducers/ThemeCustomizerSlice";

const rootReducer = combineReducers({
  // public
  Layout,
  Login,
  Account,
  ForgetPassword,
  Profile,
  // ReduxToolkit slices
  layout: LayoutSlice,
  bookmarkHeader: BookmarkHeaderSlice,
  themeCustomizer: ThemeCustomizerSlice,
});

export default rootReducer;
export type RootState = ReturnType<typeof rootReducer>;

