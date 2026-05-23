// Fake Backend Helper - Mock API implementations
// These functions simulate API calls for JWT and Fake authentication

// Mock user data
const mockUsers = [
  {
    id: 1,
    email: "admin@themesbrand.com",
    password: "123456",
    username: "admin",
    token: "mock-jwt-token-admin",
  },
  {
    id: 2,
    email: "user@themesbrand.com",
    password: "123456",
    username: "user",
    token: "mock-jwt-token-user",
  },
];

// Fake Login (Mock authentication without real backend)
export const postFakeLogin = async (data) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = mockUsers.find(
        (u) => u.email === data.email && u.password === data.password
      );
      if (user) {
        resolve({
          ...user,
          success: true,
          message: "Login successful",
        });
      } else {
        reject({
          success: false,
          message: "Invalid email or password",
        });
      }
    }, 1000);
  });
};

// JWT Login (Mock JWT authentication)
export const postJwtLogin = async (data) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = mockUsers.find(
        (u) => u.email === data.email && u.password === data.password
      );
      if (user) {
        resolve({
          ...user,
          success: true,
          message: "Login successful",
        });
      } else {
        reject({
          success: false,
          message: "Invalid email or password",
        });
      }
    }, 1000);
  });
};

// Social Login
export const postSocialLogin = async (data) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: 3,
        email: data.email || "social@example.com",
        username: "socialuser",
        token: "mock-social-token",
        success: true,
      });
    }, 1000);
  });
};

// Fake Register
export const postFakeRegister = async (data) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const existingUser = mockUsers.find((u) => u.email === data.email);
      if (existingUser) {
        reject({
          success: false,
          message: "User already exists",
        });
      } else {
        const newUser = {
          id: mockUsers.length + 1,
          email: data.email,
          username: data.username || data.email.split("@")[0],
          token: `mock-token-${Date.now()}`,
        };
        mockUsers.push(newUser);
        resolve({
          ...newUser,
          success: true,
          message: "Registration successful",
        });
      }
    }, 1000);
  });
};

// JWT Register
export const postJwtRegister = async (url, data) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const existingUser = mockUsers.find((u) => u.email === data.email);
      if (existingUser) {
        reject({
          success: false,
          message: "User already exists",
        });
      } else {
        const newUser = {
          id: mockUsers.length + 1,
          email: data.email,
          username: data.username || data.email.split("@")[0],
          token: `mock-jwt-token-${Date.now()}`,
        };
        mockUsers.push(newUser);
        resolve({
          ...newUser,
          success: true,
          message: "Registration successful",
        });
      }
    }, 1000);
  });
};

// Fake Forget Password
export const postFakeForgetPwd = async (url, data) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = mockUsers.find((u) => u.email === data.email);
      if (user) {
        resolve({
          success: true,
          message: "Password reset link sent to your email",
        });
      } else {
        reject({
          success: false,
          message: "User not found",
        });
      }
    }, 1000);
  });
};

// JWT Forget Password
export const postJwtForgetPwd = async (url, data) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = mockUsers.find((u) => u.email === data.email);
      if (user) {
        resolve({
          success: true,
          message: "Password reset link sent to your email",
        });
      } else {
        reject({
          success: false,
          message: "User not found",
        });
      }
    }, 1000);
  });
};

// Fake Profile Update
export const postFakeProfile = async (data) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: data.idx,
        username: data.username,
        email: "user@example.com",
        success: true,
        message: "Profile updated successfully",
      });
    }, 1000);
  });
};

// JWT Profile Update
export const postJwtProfile = async (url, data) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: data.idx,
        username: data.username,
        email: "user@example.com",
        success: true,
        message: "Profile updated successfully",
      });
    }, 1000);
  });
};

