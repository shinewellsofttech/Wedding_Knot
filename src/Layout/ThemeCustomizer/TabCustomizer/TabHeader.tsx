import { useCallback, useState } from 'react';
import { Btn, H5, P } from '../../../AbstractElements'
import { Configuration, PreviewSettings } from '../../../utils/Constant'
import ConfigurationClass from '../ConfigurationClass';

const TabHeader = ({callbackNav }: {callbackNav: (test: string, open: boolean) => void; }) => {
  const [modal, setModal] = useState(false);
  const toggle = useCallback(() => {
    setModal(!modal);
  }, [modal]);
  return (
    <div className="customizer-header">
      <i className="icofont-close icon-close" onClick={() => callbackNav("", false)}></i>
      <H5 className="f-w-700">{PreviewSettings}</H5>
      <P className="mb-0">
        {"Try It Real Time"} <i className="fa fa-thumbs-o-up txt-primary"></i>
      </P>
      <Btn color="primary" className="plus-popup mt-2" onClick={toggle}>{Configuration}</Btn>
      <ConfigurationClass modal={modal} toggle={toggle} />
    </div>
  )
}

export default TabHeader