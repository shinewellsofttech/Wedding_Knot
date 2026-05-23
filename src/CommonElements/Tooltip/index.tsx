import React from "react";
import type { Placement } from '@popperjs/core';
import { Tooltip } from "reactstrap";

interface propsTypes {
  children?: React.ReactNode;
  target: string | HTMLElement | React.RefObject<HTMLElement>;
  placement?: Placement;
  isOpen?: boolean;
  className?: string;
  toggle?: () => void;
  trigger?: string;
  autohide?: boolean;
}

const ToolTip = (props: propsTypes) => {
  const { children, ...res } = props;
  return <Tooltip {...res}>{children}</Tooltip>;
};

export default ToolTip;