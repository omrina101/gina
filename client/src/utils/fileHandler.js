import * as XLSX from 'xlsx';

export const handleFile = async (file) => {
  const fileExtension = file.name.split('.').pop().toLowerCase();
  
  try {
    if (fileExtension === 'xml') {
      return await parseXMLFile(file);
    } else if (['xlsx', 'xls', 'csv'].includes(fileExtension)) {
      return await parseExcelFile(file);
    } else {
      throw new Error('סוג קובץ לא נתמך. אנא השתמש בקובץ XLSX, XLS, CSV או XML');
    }
  } catch (error) {
    console.error('Error parsing file:', error);
    throw error;
  }
};

const parseExcelFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const orders = processExcelData(jsonData);
        resolve(orders);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('שגיאה בקריאת הקובץ'));
    reader.readAsArrayBuffer(file);
  });
};

const parseXMLFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const xmlText = e.target.result;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        
        const orders = processXMLData(xmlDoc);
        resolve(orders);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('שגיאה בקריאת הקובץ'));
    reader.readAsText(file);
  });
};

const processExcelData = (jsonData) => {
  if (jsonData.length < 2) {
    throw new Error('הקובץ אינו מכיל מספיק נתונים');
  }
  
  const orders = [];
  
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (row.length === 0 || row.every(cell => !cell)) continue;
    
    const order = {
      id: String(row[0] || `order-${i}`),
      orderNumber: row[0] || '',
      productName: row[1] || '',
      orderTotalIncVat: parseFloat(row[2]) || 0,
      customerShippingCostIncVat: parseFloat(row[3]) || 0,
      productCostExclVat: parseFloat(row[4]) || 0,
      productCostIncVat: parseFloat(row[5]) || 0,
      ourShippingCostExclVat: parseFloat(row[6]) || 0,
      ourShippingCostIncVat: parseFloat(row[7]) || 0,
      totalProfitExclVat: parseFloat(row[8]) || 0,
      profitFromSalePricePercent: parseFloat(row[9]) || 0,
      desiredProfitPercent: parseFloat(row[10]) || 0,
      profitFromCostPricePercent: parseFloat(row[11]) || 0
    };
    
    orders.push(order);
  }
  
  return orders;
};

const processXMLData = (xmlDoc) => {
  const orders = [];
  const orderElements = xmlDoc.getElementsByTagName('order');
  
  for (let i = 0; i < orderElements.length; i++) {
    const orderElement = orderElements[i];
    const orderId = getTextContent(orderElement, 'orderid');
    const orderSum = parseFloat(getTextContent(orderElement, 'ordersum')) || 0;
    const items = orderElement.getElementsByTagName('item');

    // Sum item prices
    let itemsTotal = 0;
    for (let j = 0; j < items.length; j++) {
      const price = parseFloat(getTextContent(items[j], 'price')) || 0;
      itemsTotal += price;
    }

    // Customer paid shipping (Inc VAT) inferred as the difference
    const customerPaidShippingIncVat = Math.max(0, orderSum - itemsTotal);

    for (let j = 0; j < items.length; j++) {
      const item = items[j];
      const itemName = getTextContent(item, 'itemname');
      const itemPrice = parseFloat(getTextContent(item, 'price')) || 0;

      // Proportional allocation of customer shipping by item price share
      const share = itemsTotal > 0 ? itemPrice / itemsTotal : 0;
      const allocatedShipping = parseFloat((customerPaidShippingIncVat * share).toFixed(2));
      
      const order = {
        id: `${orderId}-${j + 1}`,
        orderNumber: orderId,
        productName: itemName,
        orderTotalIncVat: itemPrice,
        customerShippingCostIncVat: allocatedShipping,
        productCostExclVat: 0,
        productCostIncVat: 0,
        ourShippingCostExclVat: 0,
        ourShippingCostIncVat: 0,
        totalProfitExclVat: 0,
        profitFromSalePricePercent: 0,
        desiredProfitPercent: 0,
        profitFromCostPricePercent: 0
      };
      
      orders.push(order);
    }
  }
  
  return orders;
};

const getTextContent = (element, tagName) => {
  const child = element.getElementsByTagName(tagName)[0];
  return child ? child.textContent.trim() : '';
};
