import { configureStore } from "@reduxjs/toolkit";
import LayoutSlice from "./Reducers/LayoutSlice";
import BookmarkHeaderSlice from "./Reducers/BookmarkHeaderSlice";
import ThemeCustomizerSlice from "./Reducers/ThemeCustomizerSlice";

const Store = configureStore({
  reducer: {
    layout: LayoutSlice,
    bookmarkHeader:BookmarkHeaderSlice,
    themeCustomizer: ThemeCustomizerSlice,
  },
});

export default Store;

export type RootState = ReturnType<typeof Store.getState>;
export type AppDispatch = typeof Store.dispatch;
