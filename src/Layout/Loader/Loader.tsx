import { useEffect, useState } from "react";

const Loader = () => {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setShow(false);
    }, 3000);

    return () => {
      clearTimeout(timeout);
    };
  }, [show]);
  return (
    <>
      {show && (
        <div className="loader-wrapper">
          <div className="loader">
            <div className="box"></div>
            <div className="box"></div>
            <div className="box"></div>
            <div className="box"></div>
            <div className="box"></div>
          </div>
        </div>
      )}
    </>
  );
};

export default Loader;
