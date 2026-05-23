import { Col, Container, Row } from "reactstrap";
import { P, SVG } from "../../AbstractElements";

const Footer = () => {
  return (
    <footer className="footer">
      <Container fluid>
        <Row>
          <Col md="6" className="p-0 footer-copyright">
            <P className="mb-0">
              Copyright 2025 © Shinewell Softtech Pvt. Ltd.
            </P>
          </Col>
          <Col md="6" className="p-0">
            <P className="mb-0 heart">
              Hand crafted &amp; made with 
              <SVG iconId='heart' className="footer-icon" />
            </P>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
