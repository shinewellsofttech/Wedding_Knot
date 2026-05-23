import React, { createContext, useCallback, useContext, useState } from 'react';

const UserRightsContext = createContext();

export const UserRightsProvider = ({ children }) => {
  const [userRights, setUserRights] = useState([]);
  const [rightsLoaded, setRightsLoaded] = useState(false);

  const loadUserRights = useCallback((data) => {
    setUserRights(Array.isArray(data) ? data : []);
    setRightsLoaded(true);
  }, []);

  const hasAccess = (routeName) => {
    // Comment out validation for now - allow all users to access all pages
    return true;

    /*
    const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
    const username = (authUser?.Email || authUser?.UserName || '').toString().toLowerCase();

    if (username === 'admin') {
      return true;
    }

    if (!rightsLoaded) {
      return true;
    }
    if (!userRights || userRights.length === 0) {
      return false;
    }

    const normalizedRouteName = routeName.toLowerCase().replace(/^\//, '').trim().replace(/\s+/g, '');

    const normalizeName = (s) =>
      (s || '').toLowerCase().trim().replace(/\s+/g, '').replace(/&/g, 'and').replace(/a\/c/g, 'ac');

    return userRights.some(right => {
      const hasRights = right.IsHavingRights === true || right.IsHavingRights === 1;
      if (!hasRights) return false;

      // Match by PageType (e.g. profitAndLoss) - route path segment = PageType, API returns from PageMaster
      const rightPageType = (right.PageType || '').toLowerCase().trim().replace(/^\//, '').replace(/\s+/g, '');
      if (rightPageType && rightPageType === normalizedRouteName) return true;

      // Match by Name (e.g. Profit & Loss A/c) - normalize & to "and", a/c to "ac"
      const normalizedRightName = normalizeName(right.Name || '');
      if (normalizedRightName === normalizedRouteName) return true;
      // "Profit & Loss A/c" -> "profitandlossac"; route "profitandloss"
      if (normalizedRightName === normalizedRouteName + 'ac') return true;

      if (normalizedRouteName.startsWith('add')) {
        const masterName = normalizedRouteName.replace(/^add/, '');
        if (normalizedRightName === masterName) return true;
        if (rightPageType === masterName) return true;
      }

      return false;
    });
    */
  };

  const getAllowedRouteNames = () => {
    return (userRights || []).map(right => (right.Name || '').toLowerCase());
  };

  const debugUserRights = () => {
    console.log('User Rights:', userRights?.map(right => ({ Name: right.Name, Normalized: (right.Name || '').toLowerCase() })));
  };

  const isAdmin = () => {
    const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
    const username = (authUser?.Email || authUser?.UserName || '').toString().toLowerCase();
    return username === 'admin';
  };

  return (
    <UserRightsContext.Provider value={{ userRights, setUserRights, loadUserRights, hasAccess, getAllowedRouteNames, debugUserRights, isAdmin }}>
      {children}
    </UserRightsContext.Provider>
  );
};

export const useUserRights = () => {
  const context = useContext(UserRightsContext);
  if (!context) {
    throw new Error('useUserRights must be used within a UserRightsProvider');
  }
  return context;
};
