import {put, takeLatest,takeEvery, call, select} from 'redux-saga/effects';
//Constants
import {API_WEB_URLS} from '../constants/constAPI';

//From Store Base
import * as base_acTypes from './actionTypes';
import {API_HELPER} from './../helpers/ApiHelper';




console.log('API_WEB_URLS.BASE', API_WEB_URLS.BASE);
function* sagaFill_GridData(action) {
  const {callback, apiURL} = action.data;
  try {
   
    const response = yield call(API_HELPER.apiGET, API_WEB_URLS.BASE + apiURL);
    //console.log(json);
    if (callback) {
      callback(response);
    }
  } catch (error) {
    console.log("error_Fill_GridData : " + error);
  }
}
function* sagaGet_Data(action) {
  const { callback, id, apiURL} = action.data;
  try {
    //console.log(API_WEB_URLS.BASE + apiURL + '/' + id);
    const response = yield call(API_HELPER.apiGET, API_WEB_URLS.BASE + apiURL + '/' + id);
    if (callback) {
        callback(response);
    }
  } catch (error) {
    console.log("error_Get_Data : " + error);
  }
}
function* sagaAdd_Data(action) {
  const { callback, apiURL, arguList } = action.data;
  try {
    const response = yield call(API_HELPER.apiPOST, API_WEB_URLS.BASE + apiURL, arguList);
    if (callback) {
        callback(response);
    }
  } catch (error) {
    console.log("error_Add_Data : " + error);
  }
}
function* sagaAdd_Data_MultiPart(action) {
    const { callback, apiURL, arguList } = action.data;
    //console.log(arguList);
    try {
        const response = yield call(API_HELPER.apiPOST_Multipart, API_WEB_URLS.BASE + apiURL, arguList.formData);
        if (callback) {
            callback(response);
        }
    } catch (error) {
        console.log("error_Add_Data_MultiPart : " + error);
    }
}
function* sagaEdit_Data_MultiPart(action) {
    const { callback, apiURL, arguList } = action.data;
    try {
        const response = yield call(API_HELPER.apiPUT_Multipart, API_WEB_URLS.BASE + apiURL + '/' + arguList.id, arguList.formData);
        if (callback) {
            callback(response);
        }
    } catch (error) {
        console.log("error_Edit_Data_MultiPart : " + error);
    }
}
function* sagaEdit_Data(action) {
  const { callback, apiURL, arguList } = action.data;
  try {
    const response = yield call(API_HELPER.apiPUT, API_WEB_URLS.BASE + apiURL + '/' + arguList.id, arguList);
    if (callback) {
        callback(response);
    }
  } catch (error) {
    console.log("error_Edit_Data : " + error);
  }
}
function* sagaDelete_Data(action) {
  const { callback, id, apiURL, errorCallback } = action.data;
  const deleteUrl = API_WEB_URLS.BASE + apiURL + '/' + id;
  console.log("sagaDelete_Data called with:", { id, apiURL, fullUrl: deleteUrl });
  try {
    // DELETE /api/V1/Masters/{UserId}/{UserToken}/{TableName}/{Id}
    const response = yield call(API_HELPER.apiDELETE, deleteUrl);
    console.log("sagaDelete_Data response:", response);
    if (callback) {
        callback(response);
    }
  } catch (error) {
    console.log("error_Delete_Data : " + error);
    console.error("Delete saga error details:", error);
    if (errorCallback) {
      errorCallback(error);
    } else if (callback) {
      // Call callback with error response if no errorCallback provided
      callback({ status: error.response?.status || 500, data: error.response?.data || { message: error.message } });
    }
  }
}
export function* commonActionWatcher() {
  yield takeEvery(base_acTypes.FILL_GRID_DATA, sagaFill_GridData);
  yield takeEvery(base_acTypes.GET_DATA, sagaGet_Data)
  yield takeEvery(base_acTypes.ADD_DATA, sagaAdd_Data)
  yield takeEvery(base_acTypes.ADD_DATA_MULTIPART, sagaAdd_Data_MultiPart)
  yield takeEvery(base_acTypes.EDIT_DATA_MULTIPART, sagaEdit_Data_MultiPart)
  yield takeEvery(base_acTypes.EDIT_DATA, sagaEdit_Data)
  yield takeEvery(base_acTypes.DELETE_DATA, sagaDelete_Data)
}
