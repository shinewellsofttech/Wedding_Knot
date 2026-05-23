import React, { Fragment } from "react";
import { toast } from "react-toastify";
import { Container, Modal, ModalBody, ModalFooter, ModalHeader, Row } from "reactstrap";
import { Btn, P } from "../../AbstractElements";
import ConfigDB from "../../Config/ThemeConfig";
import { useAppSelector } from "../../ReduxToolkit/Hooks";
import { PropsTypeProp } from "../../Types/Layout/ThemeCustomizerTypes";
import { Cancel, Configuration, CopyText } from "../../utils/Constant";

const ConfigurationClass: React.FC<PropsTypeProp> = ({ toggle, modal }) => {
  const { layout } = useAppSelector((state) => state.themeCustomizer);
  const configDB = ConfigDB.data;

  const handleThemeCopy = async () => {
    try {
      const clipBoardString = JSON.stringify(configDB, null, 2);
      await navigator.clipboard.writeText(clipBoardString);
    } catch (err) {
      toast.error("Failed to copy text: " + err);
    }
    toast.success("Code Copied to clipboard !", {
      position: "bottom-right",
      autoClose: 3000,
      closeOnClick: true,
      theme: "light",
    });
  };

  return (
    <Fragment>
      <Modal isOpen={modal} toggle={toggle} className="modal-body" centered={true}>
        <ModalHeader toggle={toggle}>{Configuration}</ModalHeader>
        <ModalBody>
          <Container fluid={true} className="bd-example-row">
            <Row>
              <P>{"To replace our design with your desired theme. Please do configuration as mention"}</P>
              <P>
                <b> {"Path : src > config > ThemeConfig.ts "}</b>
              </P>
            </Row>
            <pre>
              <code>
                <div> {"export class ConfigDB "}&#123;</div>
                <div> {"static data"} = &#123;</div>
                <div> {"settings"}&#58; &#123;</div>
                <div>
                  {"layout_type"}&#58; '{configDB.settings.layout_type}',
                </div>

                <div> {"sidebar"}&#58; &#123;</div>
                <div>
                  {"type"}&#58; '{layout}',
                </div>
                <div> &#125;,</div>
                <div> &#125;,</div>
                <div> {"color"}&#58; &#123;</div>
                <div>
                  {"primary_color"}&#58; '{configDB.color.primary_color}',{" "}
                </div>
                <div>
                  {"secondary_color"}&#58; '{configDB.color.secondary_color}',{" "}
                </div>
                <div>
                  {"mix_background_layout"}&#58; '{configDB.color.mix_background_layout}',{" "}
                </div>
                <div> &#125;,</div>
                <div> &#125;</div>
                <div> &#125;</div>
              </code>
            </pre>
          </Container>
        </ModalBody>
        <ModalFooter>
          <Btn color="primary" className="notification" onClick={handleThemeCopy}>
            {CopyText}
          </Btn>
          <Btn color="secondary" onClick={toggle}>
            {Cancel}
          </Btn>
        </ModalFooter>
      </Modal>
    </Fragment>
  );
};

export default ConfigurationClass;
