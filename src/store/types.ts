// TypeScript types for Redux store
import store from './index';
import type { RootState as RootReducerState } from './reducers';

export type RootState = RootReducerState;
export type AppDispatch = typeof store.dispatch;

