// functions.js
// Note: Using react-toastify instead of toastr
import { toast } from "react-toastify";

import {
  callAdd_Data_Multipart,
  callEdit_Data,
  callEdit_Data_Multipart,
  callFill_GridData,
  callGet_Data,
  callDelete_Data,
} from "./common-actions"

export const Fn_FillListData = (
  dispatch,
  setState,
  gridName,
  apiURL,
  setKey,
  setSearchKeyArray
) => {
  return new Promise((resolve, reject) => {
    const request = {
      apiURL: apiURL,
      callback: response => {
        const hasData = response && (response.status === 200 || response.success === true) && (response.data || response.dataList || response.response)
        if (hasData) {
          const dataList = response.data?.dataList ?? response.data?.data?.dataList ?? response.data?.DataList ?? response.data?.data?.DataList ?? response.data?.response ?? response.data?.data?.response ?? response.response ?? response.data?.[gridName] ?? (Array.isArray(response.data) ? response.data : []) ?? (Array.isArray(response.dataList) ? response.dataList : [])
          const list = Array.isArray(dataList) ? dataList : []
          if (gridName == "gridDataSearch") {
            const firstObject = list[0]
            const keysArray = firstObject ? Object.keys(firstObject).filter(
              item => item !== "Id"
            ) : []
            setSearchKeyArray(keysArray)
            setState(list)
            setKey(keysArray[0])
            resolve(list)
          } else if (
            gridName === "productData" ||
            gridName === "OtherDataScore"
          ) {
            setState(prevState => ({
              ...prevState,
              [gridName]: list,
              rows: list[0] ? [Object.keys(list[0])] : [],
              isProgress: false,
            }))
            resolve(list)
          } else if (gridName == "gridData") {
            setState(list)
            resolve(list)
          } else if (gridName == "FileNo") {
            const fileNo = list[0]?.FileNo
            setState(prevState => ({
              ...prevState,
              ["FileNo"]: fileNo,
            }))
            resolve(fileNo)
          } else {
            setState(prevState => ({
              ...prevState,
              [gridName]: list,
              isProgress: false,
            }))
            resolve(list)
          }
          showToastWithCloseButton("success", "Data loaded successfully")
        } else {
          showToastWithCloseButton("error", "Error loading data")
          reject(new Error("Error loading data"))
        }
      },
    }
    dispatch(callFill_GridData(request))
  })
}

export const Fn_DisplayData = (dispatch, setState, id, apiURL, gridname) => {
  const request = {
    id: id,
    apiURL: apiURL,
    callback: response => {
      if (response && response.status === 200 && response.data) {
        const dataList = response.data.dataList ?? response.data.data?.dataList ?? []
        const list = Array.isArray(dataList) ? dataList : []
        const matchId = id != null ? String(id) : null
        const record = matchId && list.length > 1
          ? list.find(item => String(item?.Id ?? item?.ID ?? item?.id ?? "") === matchId)
          : list[0]
        setState(prevState => ({
          ...prevState,
          formData: record || prevState.formData,
        }))
        showToastWithCloseButton("success", "Data displayed successfully")
      } else {
        showToastWithCloseButton("error", "Error displaying data")
      }
    },
  }
  dispatch(callGet_Data(request))
}

export const Fn_AddEditData = (
  dispatch,
  setState,
  data,
  apiURL,
  isMultiPart = false,
  getid,
  navigate,
  forward
) => {
  console.log("in function")
  return new Promise((resolve, reject) => {
    const { arguList } = data
    const request = {
      arguList: arguList,
      apiURL: apiURL,
      callback: response => {
        // Check for "Data already exists" case (status 208)
        if (response && response.data && (
          response.data.status === 208 ||
          (response.data.message && response.data.message.toLowerCase().includes("already exists")) ||
          (response.data.success === false && response.data.status === 208)
        )) {
          const message = response.data.message || "Data already exists.";
          showToastWithCloseButton("warning", message)
          reject(new Error(message))
          return
        }

        if (response && response.status === 200) {
          console.log("arguList", arguList)

          if (getid === "certificate") {
            if (response.data.response[0].Id > 0) {
              setState(response.data.response[0].RegNo)
              showToastWithCloseButton(
                "success",
                "File downloaded successfully"
              )
            } else {
              showToastWithCloseButton("error", "Duplicate mobile number")
            }
          } else if (
            response.data.response &&
            response.data.response[0].Id > 0
          ) {
            setState(true)
            localStorage.setItem(
              "YesBank",
              JSON.stringify(response.data.response[0])
            )
          } else if (getid === "TenderH") {
            setState(prevState => ({
              ...prevState,
              F_TenderFileMasterH: response.data.data.id,
            }))
          }

          if (arguList.id === 0) {
            showToastWithCloseButton("success", "Data added successfully")
            resolve(response) // ✅ return full response
            navigate(forward, { state: { Id: 0 } })
          } else {
            showToastWithCloseButton("success", "Data updated successfully")
            resolve(response) // ✅ return full response
            navigate(forward, { state: { Id: 0 } })
          }
        } else {
          if (arguList.id === 0) {
            showToastWithCloseButton("error", "Error adding data")
            reject("Some error occurred while adding data")
          } else {
            showToastWithCloseButton("error", "Error updating data")
            reject("Some error occurred while updating data")
          }
        }
      },
    }

    if (arguList.id === 0) {
      if (isMultiPart) dispatch(callAdd_Data_Multipart(request))
    } else {
      if (isMultiPart) dispatch(callEdit_Data_Multipart(request))
    }
  })
}

export const Fn_GetReport = (
  dispatch,
  setState,
  gridName,
  apiURL,
  data,
  isMultiPart = false
) => {
  return new Promise((resolve, reject) => {
    const { arguList } = data
    const request = {
      arguList: arguList,
      apiURL: apiURL,
      callback: response => {
        try {
          const ok = response && (response.status === 200 || response.success === true) && (response.data || response.response)
          if (ok) {
            const responseData = response.data?.response ?? response.data?.data?.response ?? response.response ?? (Array.isArray(response.data) ? response.data : null)
            const dataList = Array.isArray(responseData) ? responseData : []
            if (
              gridName === "productData" ||
              gridName === "productDataAssest"
            ) {
              setState(prevState => ({
                ...prevState,
                [gridName]: dataList,
                rows: dataList[0] ? [Object.keys(dataList[0])] : [],
                isProgress: false,
              }))
            } else if (gridName == "tenderData") {
              setState(dataList)
            } else {
              setState(prevState => ({
                ...prevState,
                [gridName]: dataList,
                isProgress: false,
              }))
            }

            showToastWithCloseButton("success", "Report generated successfully")
            resolve(dataList)
          } else {
            showToastWithCloseButton("warning", "Data not found")
            setState(prevState => ({ ...prevState, isProgress: false }))
            resolve(null)
          }
        } catch (error) {
          console.error("Error processing report data:", error)
          setState(prevState => ({ ...prevState, isProgress: false }))
          showToastWithCloseButton("error", "Failed to process report data")
          reject(error)
        }
      },
      errorCallback: error => {
        console.error("Error fetching report:", error)
        setState(prevState => ({ ...prevState, isProgress: false }))
        showToastWithCloseButton("error", "Failed to fetch report")
        reject(error)
      },
    }

    dispatch(callAdd_Data_Multipart(request))
  })
}

export const Fn_DeleteData = (
  dispatch,
  setState,
  id,
  apiURL,
  apiURL_Display
) => {
  console.log("Fn_DeleteData called with:", { id, apiURL, apiURL_Display });
  return new Promise((resolve, reject) => {
    const request = {
      id: id,
      apiURL: apiURL,
      callback: response => {
        console.log("Delete callback response:", response);
        // API format: { success: true, status: 200, message: "Record deleted.", data: { response: 1 } }
        const isSuccess = response && (
          (response.success === true && (response.status === 200 || response.statusCode === 200)) ||
          response.status === 200 ||
          response.statusCode === 200 ||
          (response.data && (
            response.data.status === 200 ||
            response.data.statusCode === 200 ||
            response.data.success === true ||
            response.data.response
          )) ||
          (response.response && response.response.status === 200)
        );
        
        if (isSuccess) {
          setState(prevState => ({
            ...prevState,
            confirm_alert: false,
            success_dlg: true,
            dynamic_title: "Deleted",
            dynamic_description: "Selected data has been deleted.",
          }))
          showToastWithCloseButton("success", "Data deleted successfully")

          // If apiURL_Display is provided, refresh the list
          if (apiURL_Display) {
            // Fn_FillListData(dispatch, setState, "gridData", apiURL_Display);
            // Fn_FillListData(dispatch, setState, "Invoice", apiURL_Display);
            // window.location.reload()
          }

          resolve(response) // Resolve the Promise with the response
        } else {
          const apiMsg = response.message || (response.data && response.data.message) || "Some error occurred while deleting data";
          setState(prevState => ({
            ...prevState,
            confirm_alert: false,
            dynamic_title: "Error",
            dynamic_description: apiMsg,
          }))
          showToastWithCloseButton(
            "error",
            apiMsg
          )
          reject(new Error(apiMsg)) // Reject the Promise with an error
        }
      },
      errorCallback: error => {
        console.error("Delete errorCallback:", error);
        
        let apiMsg = "Some error occurred while deleting data";
        if (error && error.response && error.response.data) {
           apiMsg = error.response.data.message || error.response.data.title || apiMsg;
        } else if (error && error.message) {
           apiMsg = error.message;
        }

        setState(prevState => ({
          ...prevState,
          confirm_alert: false,
          dynamic_title: "Error",
          dynamic_description: apiMsg,
        }))
        showToastWithCloseButton(
          "error",
          apiMsg
        )
        reject(error) // Reject the Promise with an error
      },
    }

    // Dispatch the delete action
    dispatch(callDelete_Data(request))
  })
}

export function showToastWithCloseButton(toastType, message) {
  // Using react-toastify instead of toastr
  const { toast } = require("react-toastify");
  
  const toastOptions = {
    closeButton: true,
    autoClose: 2000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  };

  if (toastType === "success") {
    toast.success(message, toastOptions);
  } else if (toastType === "error") {
    toast.error(message, toastOptions);
  } else if (toastType === "warning") {
    toast.warning(message, toastOptions);
  } else {
    toast.info(message, toastOptions);
  }
}
