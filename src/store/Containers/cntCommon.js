import { connect } from 'react-redux';
import * as commonCalls from '../common-actions';

const mapDispatchToProps = (dispatch) => ({
  callFill_GridData: (data) => dispatch(commonCalls.callFill_GridData(data)),
  callGet_Data: (data) => dispatch(commonCalls.callGet_Data(data)),
  callAdd_Data_Multipart: (data) => dispatch(commonCalls.callAdd_Data_Multipart(data)),
  callEdit_Data_Multipart: (data) => dispatch(commonCalls.callEdit_Data_Multipart(data)),
  callAdd_Data: (data) => dispatch(commonCalls.callAdd_Data(data)),
  callEdit_Data: (data) => dispatch(commonCalls.callEdit_Data(data)),
  callDelete_Data: (data) => dispatch(commonCalls.callDelete_Data(data)),
  callVerify_Data: (data) => dispatch(commonCalls.callVerify_Data(data)),
});

const mapStateToProps = (state) => ({
  isLoading: state.isLoading,
});

export const container = connect(mapStateToProps, mapDispatchToProps);
