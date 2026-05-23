interface PropTypes{
    iconId: string|undefined;
    onClick?:()=>void;
    className?: string;
    id?:string
    style?:{
      height?:number;
      width?:number;
      fill?:string;
      marginRight?:number
    }
}

const SvgIcon = (props:PropTypes) => {
  return (
    <svg className={props.className} onClick={props.onClick} style={props.style}>
      <use href={`${process.env.PUBLIC_URL}/assets/svg/feather-icons/dist/feather-sprite.svg#${props.iconId}`}></use>
    </svg>
  );
};

export default SvgIcon;