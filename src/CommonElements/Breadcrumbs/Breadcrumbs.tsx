import { Link } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem, Col, Container, Row } from "reactstrap";
import SVG from "../SVG";
import { PropsTypes } from "../../Types/CommonElements/CommonElementsTypes";
import H3 from "../Headings/H3Element";

const Breadcrumbs = ({ mainTitle, parent }: PropsTypes) => {
  return (
    <Container fluid>
      <div className="page-title">
        <Row>
          <Col sm="6" className="ps-0">
            <H3>{mainTitle}</H3>
          </Col>
          <Col sm="6" className="ps-0">
            <Breadcrumb>
              <BreadcrumbItem>
                <Link to={`${process.env.PUBLIC_URL}/pages/samplepage`}>
                  <SVG iconId="stroke-home" className="stroke-icon" />
                </Link>
              </BreadcrumbItem>
              <BreadcrumbItem>{parent}</BreadcrumbItem>
              <BreadcrumbItem active>{mainTitle}</BreadcrumbItem>
            </Breadcrumb>
          </Col>
        </Row>
      </div>
    </Container>
  );
};

export default Breadcrumbs;
