// Authentication utility to handle login state and errors

// Default empty profile to prevent "undefined" errors
export const defaultProfile = {
  profile: {
    name: '',
    email: '',
    // Add other required profile fields with default empty values
  },
  isAuthenticated: false,
  isLoading: false
};

// Helper to check if user is authenticated
export const isAuthenticated = () => {
  try {
    // You can add custom logic here
    return false; // Default to false until auth is confirmed
  } catch (error) {
    console.error("Auth check error:", error);
    return false;
  }
};

// Helper to handle profile data safely
export const safeGetProfile = (profileData) => {
  if (!profileData || !profileData.profile) {
    return defaultProfile;
  }
  return profileData;
};
