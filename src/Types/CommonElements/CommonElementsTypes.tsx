import { JSX } from "react";

export interface PropsTypes {
    mainTitle: string;
    parent: string;
}

export interface CardHeaderDropDownProps {
    firstItem: string | undefined;
    secondItem: string | undefined;
    thirdItem: string | undefined;
    mainTitle?: boolean | undefined;
    menuTitle?:string | undefined |any
}

export interface CardPropsTypes  {
    headClass?: string;
    title: string;
    titleClass?: string;
    firstItem?: string;
    secondItem?: string;
    thirdItem?: string;
    mainTitle?: boolean;
    subClass?:string
};

interface SpanType {
  text?: string;
  code?: string;
  mark?: string;
}

export interface CommonCardHeaderProp {
  title: string;
  span?: SpanType[];
  headClass?: string;
  icon?: JSX.Element;
  tagClass?: string;
}