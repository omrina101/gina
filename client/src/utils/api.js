import { db, isFirebaseEnabled } from '../firebase';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';

const APP_ID = 'profitability-calculator';

const localKey = (monthYear, userId) => `pc-orders-${userId}-${monthYear}`;

export const saveOrders = async (monthYear, userId, orders) => {
  if (isFirebaseEnabled) {
    const itemsCol = collection(db, 'artifacts', APP_ID, 'users', userId, 'orders', monthYear, 'items');
    // Save each order as its own document
    const writes = orders.map((order) => setDoc(doc(itemsCol, String(order.id)), {
      ...order,
      monthYear,
      userId,
      updatedAt: new Date().toISOString(),
    }));
    await Promise.all(writes);
    return { message: 'Orders saved successfully', count: orders.length };
  }
  // Local fallback: store the array per month
  localStorage.setItem(localKey(monthYear, userId), JSON.stringify({ orders }));
  return { message: 'Orders saved locally', count: orders.length };
};

export const loadOrders = async (monthYear, userId) => {
  if (isFirebaseEnabled) {
    const itemsCol = collection(db, 'artifacts', APP_ID, 'users', userId, 'orders', monthYear, 'items');
    const snap = await getDocs(itemsCol);
    const result = [];
    snap.forEach((d) => result.push({ id: d.id, ...d.data() }));
    return result;
  }
  const raw = localStorage.getItem(localKey(monthYear, userId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return parsed.orders || [];
  } catch {
    return [];
  }
};

export const deleteOrders = async (monthYear, userId) => {
  if (isFirebaseEnabled) {
    const itemsCol = collection(db, 'artifacts', APP_ID, 'users', userId, 'orders', monthYear, 'items');
    const snap = await getDocs(itemsCol);
    const deletes = [];
    snap.forEach((d) => deletes.push(deleteDoc(doc(itemsCol, d.id))));
    await Promise.all(deletes);
    return { message: 'Orders deleted successfully' };
  }
  localStorage.removeItem(localKey(monthYear, userId));
  return { message: 'Orders deleted locally' };
};

export const getInsights = async () => {
  throw new Error('Insights are disabled in client-only version');
};
