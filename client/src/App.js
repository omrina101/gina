import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Controls from './components/Controls';
import Table from './components/Table';
import Summary from './components/Summary';
import { handleFile } from './utils/fileHandler';
import { saveOrders, loadOrders, deleteOrders } from './utils/api';
import { ensureAnonymousAuth, auth } from './firebase';

function App() {
  const [ordersData, setOrdersData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loadingState, setLoadingState] = useState(false);
  const [errorState, setErrorState] = useState(null);
  const [currentMonthYear, setCurrentMonthYear] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [userId, setUserId] = useState('');

  // Ensure Firebase anonymous auth
  useEffect(() => {
    (async () => {
      try {
        await ensureAnonymousAuth();
        if (auth && auth.currentUser) {
          setUserId(auth.currentUser.uid);
        } else {
          setUserId('local-user');
        }
      } catch (e) {
        console.error('Auth error:', e);
        setErrorState('שגיאה באימות המשתמש');
        setUserId('local-user');
      }
    })();
  }, []);

  // Load orders when month/year or userId changes
  useEffect(() => {
    if (currentMonthYear && userId) {
      loadOrdersData();
    }
  }, [currentMonthYear, userId]);

  // Filter data when search term or dataset changes
  useEffect(() => {
    filterTable();
  }, [searchTerm, ordersData]);

  const loadOrdersData = async () => {
    try {
      setLoadingState(true);
      setErrorState(null);
      const data = await loadOrders(currentMonthYear, userId);
      setOrdersData(data);
    } catch (error) {
      setErrorState('שגיאה בטעינת הנתונים');
      console.error('Error loading orders:', error);
    } finally {
      setLoadingState(false);
    }
  };

  const filterTable = () => {
    if (!searchTerm.trim()) {
      setFilteredData(ordersData);
      return;
    }

    const filtered = ordersData.filter(order => 
      order.orderNumber?.toString().includes(searchTerm) ||
      order.productName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(filtered);
  };

  const handleFileUpload = async (file) => {
    try {
      setLoadingState(true);
      setErrorState(null);
      
      const parsedData = await handleFile(file);
      
      // Save to Firestore or localStorage
      await saveOrders(currentMonthYear, userId, parsedData);
      
      setOrdersData(parsedData);
      setSearchTerm('');
      
    } catch (error) {
      setErrorState('שגיאה בעיבוד הקובץ');
      console.error('Error processing file:', error);
    } finally {
      setLoadingState(false);
    }
  };

  const handleOrderUpdate = async (orderId, updatedOrder) => {
    try {
      const updatedData = ordersData.map(order => 
        order.id === orderId ? updatedOrder : order
      );
      
      setOrdersData(updatedData);
      
      // Save to Firestore/localStorage (full snapshot for simplicity)
      await saveOrders(currentMonthYear, userId, updatedData);
      
    } catch (error) {
      setErrorState('שגיאה בעדכון הנתונים');
      console.error('Error updating order:', error);
    }
  };

  const handleResetData = async () => {
    try {
      setLoadingState(true);
      await deleteOrders(currentMonthYear, userId);
      setOrdersData([]);
      setFilteredData([]);
      setSearchTerm('');
    } catch (error) {
      setErrorState('שגיאה במחיקת הנתונים');
      console.error('Error resetting data:', error);
    } finally {
      setLoadingState(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-hebrew">
      <div className="container mx-auto px-4 py-8">
        <Header />
        
        <Controls 
          onFileUpload={handleFileUpload}
          currentMonthYear={currentMonthYear}
          setCurrentMonthYear={setCurrentMonthYear}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onResetData={handleResetData}
          loading={loadingState}
        />
        
        {errorState && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {errorState}
          </div>
        )}
        
        {loadingState && (
          <div className="flex justify-center items-center py-8">
            <div className="spinner"></div>
            <span className="mr-2">טוען...</span>
          </div>
        )}
        
        {!loadingState && ordersData.length > 0 && (
          <>
            <Table 
              data={filteredData}
              onOrderUpdate={handleOrderUpdate}
            />
            
            <Summary 
              data={filteredData}
            />
          </>
        )}
        
        {!loadingState && ordersData.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              טען קובץ כדי להתחיל לנתח את הרווחיות
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
