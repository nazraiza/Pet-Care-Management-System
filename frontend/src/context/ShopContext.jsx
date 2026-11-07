import { createContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
  const currency = '৳';
  const delivery_fee = 50;
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://pet-care-backend-422z.onrender.com';
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(true);
  const [cartItems, setCartItems] = useState({});
  const [products, setProducts] = useState([]);
  const location = useLocation();

  // Always read the token from localStorage (set by UserHeader.jsx)
  const getToken = () => localStorage.getItem('petOwnerToken');

  // Debug: Log the token value on every render
  useEffect(() => {
    console.log('ShopContext: petOwnerToken in localStorage:', getToken());
  });

  // On initial load and when token changes, sync cart
  useEffect(() => {
    const token = getToken();
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserCart(token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      const localCart = localStorage.getItem('localCart');
      setCartItems(localCart ? JSON.parse(localCart) : {});
    }
    // eslint-disable-next-line
  }, []);

  // Listen for storage events (token changes in other tabs or after logout)
  useEffect(() => {
    const syncToken = () => {
      const token = getToken();
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        fetchUserCart(token);
      } else {
        delete axios.defaults.headers.common['Authorization'];
        const localCart = localStorage.getItem('localCart');
        setCartItems(localCart ? JSON.parse(localCart) : {});
      }
    };
    window.addEventListener('storage', syncToken);
    return () => window.removeEventListener('storage', syncToken);
  }, []);

  // Refresh cart/token state on every route change
  useEffect(() => {
    const token = getToken();
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserCart(token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      const localCart = localStorage.getItem('localCart');
      setCartItems(localCart ? JSON.parse(localCart) : {});
    }
    // eslint-disable-next-line
  }, [location.pathname]);

  useEffect(() => {
    if (!getToken()) {
      localStorage.setItem('localCart', JSON.stringify(cartItems));
    }
  }, [cartItems]);

  const fetchUserCart = async (token) => {
    if (!token) return;
    try {
      const response = await axios.post(
        `${backendUrl}/api/cart/get`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
     if (response.data.success) {
  setCartItems(response.data.cartData);
}
    } catch (error) {
      if (error.response?.status === 401) {
        delete axios.defaults.headers.common['Authorization'];
        const localCart = localStorage.getItem('localCart');
        setCartItems(localCart ? JSON.parse(localCart) : {});
        toast.error('Session expired. Please login again.');
      }
    }
  };

const addToCart = async (itemId) => {  // no size parameter
  const originalCartItems = structuredClone(cartItems);
  let cartData = structuredClone(cartItems);

  const defaultKey = 'default'; // placeholder key for all products

  if (cartData[itemId]) {
    cartData[itemId][defaultKey] = (cartData[itemId][defaultKey] || 0) + 1;
  } else {
    cartData[itemId] = { [defaultKey]: 1 };
  }

  setCartItems(cartData);
  toast.success('Product added to cart!');

  const token = getToken();
  if (token) {
    try {
      await axios.post(`${backendUrl}/api/cart/add`, { itemId, size: defaultKey }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add product');
      setCartItems(originalCartItems);
    }
  } else {
    localStorage.setItem('localCart', JSON.stringify(cartData));
  }
};

const updateQuantity = async (itemId, _size, quantity) => { // _size ignored
  const defaultKey = 'default';
  let cartData = structuredClone(cartItems);

  if (quantity <= 0) {
    delete cartData[itemId][defaultKey];
    if (Object.keys(cartData[itemId]).length === 0) {
      delete cartData[itemId];
    }
  } else {
    cartData[itemId][defaultKey] = quantity;
  }

  setCartItems(cartData);
  localStorage.setItem('localCart', JSON.stringify(cartData));

  const token = getToken();
  if (token) {
    await axios.post(`${backendUrl}/api/cart/update`, { itemId, size: defaultKey, quantity }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
};

  const getCartCount = () => {
    let totalCount = 0;
    for (const items in cartItems) {
      for (const item in cartItems[items]) {
        try {
          if (cartItems[items][item] > 0) {
            totalCount += cartItems[items][item];
          }
        } catch (error) {
          console.error('getCartCount error:', error);
        }
      }
    }
    return totalCount;
  };

  const getCartAmount = () => {
    let totalAmount = 0;
    for (const items in cartItems) {
      let itemInfo = products.find((product) => product._id === items);
      for (const item in cartItems[items]) {
        try {
          if (cartItems[items][item] > 0 && itemInfo) {
            totalAmount += itemInfo.price * cartItems[items][item];
          }
        } catch (error) {
          console.error('getCartAmount error:', error);
        }
      }
    }
    return totalAmount;
  };

  const getProductsData = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/product/list`);
      if (response.data.success) {
        setProducts(response.data.products);
      } else {
        toast.error(response.data.message || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('getProductsData error:', error);
      toast.error(error.message || 'Error fetching products');
    }
  };

  const checkAuth = () => {
    const token = getToken();
    if (!token) {
      toast.error('Please login to continue');
      return false;
    }
    return true;
  };

  useEffect(() => {
    getProductsData();
  }, []);

const value = {
  products,
  currency,
  delivery_fee,
  search,
  setSearch,
  showSearch,
  setShowSearch,
  cartItems,
  addToCart,         // updated to default key internally
  getCartCount,
  updateQuantity,    // updated to use defaultKey internally instead of size
  getCartAmount,
  backendUrl,
  checkAuth,
};

  return <ShopContext.Provider value={value}>{props.children}</ShopContext.Provider>;
};

export default ShopContextProvider;