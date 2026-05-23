import { Link, useNavigate } from "react-router-dom";
import { Col, Container, Form, FormGroup, Input, Label, Row } from "reactstrap";
import { Btn, H3, H4, Image, P } from "../../AbstractElements";
import { dynamicImage } from "../../Service";
import { CreateAccount, DoNotAccount, ForgotPassword, Href, Password, RememberPassword, SignIn, SignInAccount, SignInWith } from "../../utils/Constant";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import SocialApp from "./SocialApp";
import { API_HELPER } from "../../helpers/ApiHelper";
import { API_WEB_URLS } from "../../constants/constAPI";

const USER_MASTER_LIST_URL = `${API_WEB_URLS.BASE}${API_WEB_URLS.MASTER}/0/token/${API_WEB_URLS.UserMaster}/Id/0`;
const GET_COMPANIES_BY_USER_URL = (userId: string | number) =>
  `${API_WEB_URLS.BASE}${API_WEB_URLS.MASTER}/0/token/GetCompaniesByUserId/Id/${userId}`;
const LOGIN_URL = `${API_WEB_URLS.BASE}AdminLogin/0/token`;

const getDataList = (response: any) =>
  response?.data?.dataList ?? response?.data?.data?.dataList ?? (Array.isArray(response?.data) ? response.data : []);

const Login = () => {
  const [show, setShow] = useState(false);
  const [userList, setUserList] = useState<any[]>([]);
  const [companyList, setCompanyList] = useState<any[]>([]);
  const [f_UserMaster, setF_UserMaster] = useState("");
  const [f_CompanyMaster, setF_CompanyMaster] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    setLoadingUsers(true);
    fetch(USER_MASTER_LIST_URL)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          const list = getDataList(data);
          setUserList(Array.isArray(list) ? list : []);
        }
      })
      .catch(() => {
        if (!cancelled) setUserList([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingUsers(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchCompaniesByUser = useCallback((userId: string, users: any[] = []) => {
    if (!userId || userId === "0") {
      setCompanyList([]);
      setF_CompanyMaster("");
      return;
    }
    const selectedUser = users.find((u) => String(u?.Id) === String(userId));
    const isSuperAdmin = selectedUser?.IsSuperAdmin === true || selectedUser?.IsSuperAdmin === 1;
    const effectiveUserId = isSuperAdmin ? "0" : userId;

    setLoadingCompanies(true);
    setF_CompanyMaster("");
    fetch(GET_COMPANIES_BY_USER_URL(effectiveUserId))
      .then((res) => res.json())
      .then((data) => {
        const list = getDataList(data);
        setCompanyList(Array.isArray(list) ? list : []);
      })
      .catch(() => setCompanyList([]))
      .finally(() => setLoadingCompanies(false));
  }, []);

  useEffect(() => {
    fetchCompaniesByUser(f_UserMaster, userList);
  }, [f_UserMaster, userList, fetchCompaniesByUser]);

  const SimpleLoginHandle = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // User validation hidden
    // if (!f_UserMaster || f_UserMaster === "0") {
    //   toast.error("Please select User.");
    //   return;
    // }
    // Company validation hidden
    // if (!f_CompanyMaster || f_CompanyMaster === "0") {
    //   toast.error("Please select Company.");
    //   return;
    // }
    if (!userName.trim()) {
      toast.error("User Name is required.");
      return;
    }
    if (!password) {
      toast.error("Password is required.");
      return;
    }
    const formData = new FormData();
    // formData.append("F_UserMaster", String(f_UserMaster)); // hidden for now
    // formData.append("F_CompanyMaster", String(f_CompanyMaster)); // hidden for now
    formData.append("UserName", userName.trim());
    formData.append("UserPassword", password);
    try {
      const response = await API_HELPER.apiPOST_Multipart(LOGIN_URL, formData);
      const userData = response?.data?.response?.[0];
      const isSuccess = response?.success === true && response?.status === 200 && userData?.Id;
      const loginMessage = userData?.Message;
      if (isSuccess && (loginMessage === "Login Successful" || userData?.LoginStatus === 1)) {
        const fromApi = userData?.CompanyName ?? userData?.FirmName ?? userData?.Company ?? "";
        const selectedCompany = companyList.find((c: any) => String(c?.F_CompanyMaster) === String(f_CompanyMaster));
        const fromDropdown = selectedCompany?.CompanyName ?? selectedCompany?.Name ?? "";
        const companyName = (typeof fromApi === "string" && fromApi.trim()) ? fromApi.trim() : (typeof fromDropdown === "string" ? fromDropdown.trim() : "");
        localStorage.setItem("authUser", JSON.stringify({ ...userData, CompanyName: companyName || userData?.CompanyName }));
        localStorage.setItem("login", JSON.stringify(true));
        toast.success(loginMessage || "Login Successful");
        navigate(`${process.env.PUBLIC_URL}/addEditItemMaster`);
      } else {
        toast.error(response?.message || loginMessage || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Unable to login. Please try again.");
    }
  };

  return (
    <div className="login-wrapper">
      <style>{`
        body, html {
          height: 100%;
          margin: 0;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        .login-wrapper {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: linear-gradient(-45deg, #1e1e2f, #2d2b42, #182039, #251b33);
          background-size: 400% 400%;
          animation: gradientBG 15s ease infinite;
        }

        @keyframes gradientBG {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .premium-login-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 3.5rem 3rem;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2), 0 5px 15px rgba(0,0,0,0.1);
          color: #ffffff;
          animation: slideUpFade 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
          transform: translateY(30px);
        }

        @keyframes slideUpFade {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .brand-title {
          font-size: 2.25rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #ffffff 0%, #a5a5b4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-align: center;
          letter-spacing: -0.5px;
        }

        .brand-subtitle {
          text-align: center;
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 3rem;
          font-weight: 400;
        }

        .premium-form-group {
          margin-bottom: 1.5rem;
          position: relative;
        }

        .premium-label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .premium-input {
          width: 100%;
          padding: 1.1rem 1.25rem;
          background: rgba(0, 0, 0, 0.2) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 12px !important;
          color: #ffffff !important;
          font-size: 1rem;
          transition: all 0.3s ease;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }

        .premium-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .premium-input:focus {
          outline: none;
          background: rgba(0, 0, 0, 0.3) !important;
          border-color: rgba(121, 113, 234, 0.6) !important;
          box-shadow: 0 0 0 4px rgba(121, 113, 234, 0.15) !important;
        }

        .premium-btn {
          width: 100%;
          padding: 1.1rem;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%) !important;
          color: #ffffff !important;
          border: none !important;
          border-radius: 12px !important;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 1.5rem;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4);
        }

        .premium-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(79, 70, 229, 0.5);
          background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%) !important;
        }

        .premium-btn:active {
          transform: translateY(1px);
        }

        .show-hide-premium {
          position: absolute;
          right: 15px;
          top: 44px;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.9rem;
          font-weight: 600;
          transition: color 0.3s ease;
          user-select: none;
        }

        .show-hide-premium:hover {
          color: #ffffff;
        }

        @media (max-width: 576px) {
          .premium-login-card {
            padding: 2.5rem 1.5rem;
          }
        }
      `}</style>

      <div className="premium-login-card">
        <h1 className="brand-title">Wedding Knot</h1>
        <p className="brand-subtitle">Secure Access Portal</p>

        <Form onSubmit={(e) => SimpleLoginHandle(e)}>
          <FormGroup className="premium-form-group">
            <Label className="premium-label">Username</Label>
            <Input
              className="premium-input"
              type="text"
              required
              placeholder="Enter your username"
              value={userName}
              name="userName"
              onChange={(e) => setUserName(e.target.value)}
              autoComplete="off"
            />  
          </FormGroup>

          <FormGroup className="premium-form-group">
            <Label className="premium-label">Password</Label>
            <Input
              className="premium-input"
              type={show ? "text" : "password"}
              required
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              name="password"
            />
            <div className="show-hide-premium" onClick={() => setShow(!show)}>
              {show ? "HIDE" : "SHOW"}
            </div>
          </FormGroup>

          <Btn color="primary" className="premium-btn" type="submit">
            Sign In
          </Btn>
        </Form>
      </div>
    </div>
  );
};

export default Login;