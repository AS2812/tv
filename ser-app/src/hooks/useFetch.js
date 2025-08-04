import { useState, useEffect } from 'react';
import { defaultProfile } from '../utils/auth';

const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Add credentials to include cookies
        const fetchOptions = {
          ...options,
          credentials: 'include',
          headers: {
            ...options.headers,
            'Content-Type': 'application/json',
          }
        };
        
        // Make sure URL is properly formatted
        const apiUrl = url.startsWith('http') ? url : url;
        
        const response = await fetch(apiUrl, fetchOptions);
        
        if (response.status === 401) {
          // Handle unauthorized gracefully
          console.log("User not authenticated, returning default profile");
          setData(defaultProfile);
          return;
        }
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        console.error("API fetch error:", err);
        setError(err.message || 'An error occurred');
        
        // For profile-related endpoints, use default profile on error
        if (url.includes('/api/auth/me') || url.includes('/profile')) {
          setData(defaultProfile);
        } else {
          setData(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
};

export default useFetch;
