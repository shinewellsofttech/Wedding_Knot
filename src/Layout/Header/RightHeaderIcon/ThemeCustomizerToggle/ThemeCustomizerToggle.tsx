import { LI, SVG } from "../../../../AbstractElements";
import { useAppDispatch, useAppSelector } from "../../../../ReduxToolkit/Hooks";
import { setOpenCus } from "../../../../ReduxToolkit/Reducers/ThemeCustomizerSlice";

const ThemeCustomizerToggle = () => {
  const dispatch = useAppDispatch();
  const { openCus } = useAppSelector((state) => state.themeCustomizer);

  const handleToggle = () => {
    dispatch(setOpenCus(!openCus));
  };

  return (
    <LI
      onClick={handleToggle}
      className={`customizer-toggle-item ${openCus ? "active" : ""} d-none d-lg-block`}
      title={openCus ? "Close Theme Customizer" : "Theme Customizer"}
    >
      <SVG iconId="customizer-color" className={openCus ? "text-primary" : ""} />
    </LI>
  );
};

export default ThemeCustomizerToggle;

