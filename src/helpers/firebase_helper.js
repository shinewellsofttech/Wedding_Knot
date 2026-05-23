// Firebase Helper - Mock implementation
// This is a stub implementation for Firebase backend integration

const getFirebaseBackend = () => {
  return {
    loginUser: async (email, password) => {
      // Mock Firebase login - replace with actual Firebase implementation
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            uid: "mock-user-id",
            email: email,
            displayName: "Mock User",
            token: "mock-firebase-token",
          });
        }, 1000);
      });
    },
    
    logout: async () => {
      // Mock Firebase logout
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true });
        }, 500);
      });
    },
    
    socialLoginUser: async (type) => {
      // Mock social login (Google, Facebook, etc.)
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            uid: "mock-social-user-id",
            email: "social@example.com",
            displayName: "Social User",
            token: "mock-social-token",
          });
        }, 1000);
      });
    },
    
    forgetPassword: async (email) => {
      // Mock password reset
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true, message: "Password reset email sent" });
        }, 1000);
      });
    },
    
    registerUser: async (email, password) => {
      // Mock user registration
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            uid: "mock-new-user-id",
            email: email,
            displayName: "New User",
            token: "mock-register-token",
          });
        }, 1000);
      });
    },
    
    editProfileAPI: async (username, idx) => {
      // Mock profile update
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            uid: idx,
            username: username,
            email: "user@example.com",
            updated: true,
          });
        }, 1000);
      });
    },
  };
};

export { getFirebaseBackend };

