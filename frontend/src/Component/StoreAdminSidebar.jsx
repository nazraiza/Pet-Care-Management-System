import React from 'react'
import { assets } from '../assets/assets'
import { PlusCircle, ShoppingBag, Package, FileText } from 'lucide-react'


const StoreAdminSidebar = ({ activeTab, setActiveTab, onLogout }) => {
  return (
    <div className="w-64 bg-amber-800 text-white min-h-screen p-6">
      <h2 className="text-xl font-bold mb-8">Store Admin</h2>
      <ul>
        <li
          className={`mb-4 cursor-pointer ${activeTab === 'add' ? 'font-bold' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          Add Products
        </li>
        <li
          className={`mb-4 cursor-pointer ${activeTab === 'list' ? 'font-bold' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          Product List
        </li>
        <li
          className={`mb-4 cursor-pointer ${activeTab === 'orders' ? 'font-bold' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Manage Orders
        </li>
        <li
          className={`mb-4 cursor-pointer ${activeTab === 'reports' ? 'font-bold' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Sales Reports
        </li>
        <li
          className="mt-8 cursor-pointer"
          onClick={onLogout}
        >
          Logout
        </li>
      </ul>
    </div>
  );
};


export default StoreAdminSidebar