import * as React from 'react';
// import {View, ActivityIndicator} from 'react-native';
// import {spinnerStyle} from './spinnerStyle';
const withLoadingScreen = (WrappedComponent) => {
  return class LoadingScreen extends React.PureComponent {
    render() {
      console.log (this.props.isLoading);
//       if (this.props.isLoading) {
        
//         return (
//    <div className="page-content">
// <h1>Loading Page</h1>
// <div className="spinner-border text-primary m-1" style={{marginTop: "13px" }} role="status">
//           <span className="sr-only">Loading...</span>
//     </div>
//           <WrappedComponent {...this.props} />
// </div>
  
        
//         );
//       }
      return ( <div className="page-content">
      {/* <h1>dsad</h1> */}
            <WrappedComponent {...this.props} />
      </div>);
    }
  };
};

export default withLoadingScreen;
