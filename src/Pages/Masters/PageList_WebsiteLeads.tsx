import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardBody, Col, Container, Input, Row, Table } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { API_WEB_URLS } from "../../constants/constAPI";
import { toast } from "react-toastify";

interface WebsiteLead {
  Id: number | string;
  Name?: string;
  MobileNo: string;
  Email?: string;
  CreatedDate?: string;
}

const PageList_WebsiteLeads = () => {
  const [leads, setLeads] = useState<WebsiteLead[]>([]);
  const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);
  const [filterText, setFilterText] = useState("");
  const [isProgress, setIsProgress] = useState(true);

  const GET_LEADS_URL = `${API_WEB_URLS.BASE}WebsiteLeads/GetLeads/0/token`;
  const DELETE_LEADS_URL = `${API_WEB_URLS.BASE}WebsiteLeads/DeleteLeads/0/token`;

  const loadData = useCallback(async () => {
    setIsProgress(true);
    try {
      const response = await fetch(GET_LEADS_URL);
      const data = await response.json();
      const list = data?.data?.dataList || data?.dataList || [];
      setLeads(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to fetch website leads:", err);
      toast.error("Failed to load website leads");
    } finally {
      setIsProgress(false);
    }
  }, [GET_LEADS_URL]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered leads based on search text
  const filteredLeads = useMemo(() => {
    const query = filterText.toLowerCase().trim();
    if (!query) return leads;
    return leads.filter((item) => {
      const nameMatch = (item.Name || "").toLowerCase().includes(query);
      const mobileMatch = (item.MobileNo || "").toLowerCase().includes(query);
      const emailMatch = (item.Email || "").toLowerCase().includes(query);
      return nameMatch || mobileMatch || emailMatch;
    });
  }, [leads, filterText]);

  // Select all handler
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = filteredLeads.map((item) => item.Id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  // Toggle single row selection
  const handleSelectRow = (id: number | string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const isAllSelected = useMemo(() => {
    if (filteredLeads.length === 0) return false;
    return filteredLeads.every((item) => selectedIds.includes(item.Id));
  }, [filteredLeads, selectedIds]);

  // Bulk delete leads by comma-separated IDs
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      toast.info("Please select at least one lead to delete.");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected lead(s)?`)) {
      return;
    }

    const commaSeparatedIds = selectedIds.join(",");

    try {
      const formData = new FormData();
      formData.append("Ids", commaSeparatedIds);

      const response = await fetch(DELETE_LEADS_URL, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result && (result.success || result.Success)) {
        toast.success(result.message || result.Message || "Selected lead(s) deleted successfully.");
        setSelectedIds([]);
        loadData();
      } else {
        toast.error(result.message || result.Message || "Failed to delete selected leads.");
      }
    } catch (err) {
      console.error("Error deleting leads:", err);
      toast.error("An error occurred while deleting leads.");
    }
  };

  // Single row delete
  const handleDeleteSingle = async (id: number | string, mobileNo: string) => {
    if (!window.confirm(`Are you sure you want to delete lead with Mobile No. '${mobileNo}'?`)) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append("Ids", String(id));

      const response = await fetch(DELETE_LEADS_URL, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result && (result.success || result.Success)) {
        toast.success("Lead deleted successfully.");
        setSelectedIds((prev) => prev.filter((item) => item !== id));
        loadData();
      } else {
        toast.error("Failed to delete lead.");
      }
    } catch (err) {
      console.error("Error deleting lead:", err);
      toast.error("An error occurred while deleting lead.");
    }
  };

  return (
    <div className="page-body">
      <Breadcrumbs mainTitle="Website Leads" parent="Masters" />
      <Container fluid>
        <Row>
          <Col sm="12">
            <Card>
              <CardHeaderCommon
                title="Website Visitor Leads"
                tagClass="card-title mb-0"
              />
              <CardBody>
                <Row className="mb-3 align-items-center">
                  <Col md="6" className="mb-2 mb-md-0">
                    <Input
                      type="text"
                      placeholder="Search by Name or Mobile No..."
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      style={{ maxWidth: "320px" }}
                    />
                  </Col>
                  <Col md="6" className="text-md-end">
                    <Btn
                      color="danger"
                      onClick={handleDeleteSelected}
                      disabled={selectedIds.length === 0}
                      className="d-inline-flex align-items-center"
                    >
                      <i className="fa fa-trash me-2"></i>
                      Delete Selected {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
                    </Btn>
                  </Col>
                </Row>

                <div className="table-responsive">
                  <Table hover striped className="align-middle text-center border">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "40px" }}>
                          <Input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={handleSelectAll}
                          />
                        </th>
                        <th style={{ width: "60px" }}>#</th>
                        <th>Name</th>
                        <th>Mobile Number</th>
                        <th>Email</th>
                        <th>Created Date</th>
                        <th style={{ width: "100px" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isProgress ? (
                        <tr>
                          <td colSpan={7} className="py-4 text-muted">
                            Loading website leads...
                          </td>
                        </tr>
                      ) : filteredLeads.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-4 text-muted">
                            No website leads found.
                          </td>
                        </tr>
                      ) : (
                        filteredLeads.map((item, index) => {
                          const isSelected = selectedIds.includes(item.Id);
                          const dateStr = item.CreatedDate
                            ? new Date(item.CreatedDate).toLocaleString()
                            : "-";
                          return (
                            <tr key={item.Id} className={isSelected ? "table-active" : ""}>
                              <td>
                                <Input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleSelectRow(item.Id)}
                                />
                              </td>
                              <td>{index + 1}</td>
                              <td className="fw-medium text-start">{item.Name || "N/A"}</td>
                              <td>{item.MobileNo}</td>
                              <td>{item.Email || "-"}</td>
                              <td>{dateStr}</td>
                              <td>
                                <Btn
                                  color="danger"
                                  size="sm"
                                  onClick={() => handleDeleteSingle(item.Id, item.MobileNo)}
                                  title="Delete Lead"
                                >
                                  <i className="fa fa-trash"></i>
                                </Btn>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </Table>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default PageList_WebsiteLeads;
