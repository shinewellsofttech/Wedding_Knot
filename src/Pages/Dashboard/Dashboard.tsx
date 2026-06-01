import React from "react";
import { Container, Row, Col, Card, CardBody } from "reactstrap";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";

const Dashboard = () => {
  return (
    <>
      <style>{`
        .dashboard-wrapper {
          padding-top: 20px;
          background-color: #f8f9fa;
          min-height: calc(100vh - 80px);
          display: flex;
          flex-direction: column;
        }

        .welcome-banner {
          background: linear-gradient(-45deg, #4f46e5, #7c3aed, #2563eb, #db2777);
          background-size: 400% 400%;
          animation: gradient 15s ease infinite;
          border-radius: 20px;
          padding: 4rem 2rem;
          color: white;
          text-align: center;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
          margin-top: 2rem;
        }

        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .welcome-title {
          font-size: 3.5rem;
          font-weight: 800;
          margin-bottom: 1rem;
          letter-spacing: -1px;
          text-shadow: 0 2px 10px rgba(0,0,0,0.1);
          animation: slideUp 0.8s ease-out forwards;
          opacity: 0;
          transform: translateY(20px);
        }

        .welcome-subtitle {
          font-size: 1.25rem;
          font-weight: 400;
          opacity: 0.9;
          animation: slideUp 0.8s ease-out 0.2s forwards;
          opacity: 0;
          transform: translateY(20px);
        }

        .welcome-logo {
          width: 150px;
          height: auto;
          margin-bottom: 1.5rem;
          animation: slideUp 0.8s ease-out forwards;
          opacity: 0;
          transform: translateY(20px);
          filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2));
        }

        @keyframes slideUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .decorative-circle {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(5px);
        }

        .circle-1 {
          width: 300px;
          height: 300px;
          top: -100px;
          left: -50px;
        }

        .circle-2 {
          width: 200px;
          height: 200px;
          bottom: -50px;
          right: -50px;
        }
      `}</style>

      <div className="page-body dashboard-wrapper">
        <Breadcrumbs mainTitle="Dashboard" parent="Home" />
        <Container fluid>
          <Row>
            <Col sm="12">
              <div className="welcome-banner">
                <div className="decorative-circle circle-1"></div>
                <div className="decorative-circle circle-2"></div>
                <img src={`${process.env.PUBLIC_URL}/assets/images/image.png`} alt="Wedding Knot Logo" className="welcome-logo" />
                <h1 className="welcome-title">Welcome to Wedding Knot</h1>
                <p className="welcome-subtitle">Have a great day at work! Your Software is ready to use.</p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};

export default Dashboard;
