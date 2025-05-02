import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Partner,
  Fund,
  Transaction,
  InventoryItem,
  Purchase,
  Sale,
  ProfitDistribution
} from '../types';

// Partners
export const partnersCollection = collection(db, 'partners');

export const getPartners = async (): Promise<Partner[]> => {
  console.log('Getting all partners');
  try {
    const snapshot = await getDocs(partnersCollection);
    console.log(`Found ${snapshot.docs.length} partners`);

    const partners = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log(`Partner ${doc.id}:`, data);
      return {
        id: doc.id,
        ...data
      } as Partner;
    });

    console.log('Returning partners:', partners);
    return partners;
  } catch (error) {
    console.error('Error getting partners:', error);
    return []; // Return empty array on error
  }
};

export const getPartner = async (id: string): Promise<Partner | null> => {
  const docRef = doc(partnersCollection, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Partner : null;
};

export const addPartner = async (partner: Omit<Partner, 'id'>): Promise<Partner> => {
  const newDocRef = doc(partnersCollection);
  const newPartner = { ...partner, id: newDocRef.id };
  await setDoc(newDocRef, newPartner);
  return newPartner;
};

export const updatePartner = async (id: string, data: Partial<Partner>): Promise<void> => {
  console.log(`Updating partner ${id} with data:`, data);
  try {
    const docRef = doc(partnersCollection, id);
    await updateDoc(docRef, data);
    console.log(`Partner ${id} updated successfully`);
  } catch (error) {
    console.error(`Error updating partner ${id}:`, error);
    throw error; // Re-throw to handle in the calling function
  }
};

export const deletePartner = async (id: string): Promise<void> => {
  const docRef = doc(partnersCollection, id);
  await deleteDoc(docRef);
};

// Funds
export const fundsCollection = collection(db, 'funds');

export const getFunds = async (): Promise<Fund[]> => {
  console.log('Getting all funds');
  try {
    const snapshot = await getDocs(fundsCollection);
    console.log(`Found ${snapshot.docs.length} funds`);

    const funds = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log(`Fund ${doc.id}:`, data);
      return {
        id: doc.id,
        ...data,
        // Ensure transactions is an array
        transactions: data.transactions || []
      } as Fund;
    });

    console.log('Returning funds:', funds);
    return funds;
  } catch (error) {
    console.error('Error getting funds:', error);
    return []; // Return empty array on error
  }
};

export const getFund = async (id: string): Promise<Fund | null> => {
  const docRef = doc(fundsCollection, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Fund : null;
};

export const addFund = async (fund: Omit<Fund, 'id'>): Promise<Fund> => {
  const newDocRef = doc(fundsCollection);
  const newFund = { ...fund, id: newDocRef.id };
  await setDoc(newDocRef, newFund);
  return newFund;
};

export const updateFund = async (id: string, data: Partial<Fund>): Promise<void> => {
  console.log(`Updating fund ${id} with data:`, data);
  try {
    const docRef = doc(fundsCollection, id);
    await updateDoc(docRef, data);
    console.log(`Fund ${id} updated successfully`);
  } catch (error) {
    console.error(`Error updating fund ${id}:`, error);
    throw error; // Re-throw to handle in the calling function
  }
};

export const deleteFund = async (id: string): Promise<void> => {
  const docRef = doc(fundsCollection, id);
  await deleteDoc(docRef);
};

// Transactions
export const transactionsCollection = collection(db, 'transactions');

export const getTransactions = async (): Promise<Transaction[]> => {
  const snapshot = await getDocs(transactionsCollection);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: (doc.data().date as any).toDate()
  } as Transaction));
};

export const getTransactionsByFund = async (fundId: string): Promise<Transaction[]> => {
  console.log(`Getting transactions for fund ID: ${fundId}`);
  try {
    // Get all transactions first, then filter them in memory
    // This avoids the need for composite indexes in Firestore
    const snapshot = await getDocs(transactionsCollection);
    console.log(`Found ${snapshot.docs.length} total transactions`);

    const transactions: Transaction[] = [];

    snapshot.docs.forEach(doc => {
      try {
        const data = doc.data();

        // Check if this transaction is related to the fund
        const isLegacyFund = data.fundId === fundId;
        const isSourceFund = data.sourceFundId === fundId;
        const isDestinationFund = data.destinationFundId === fundId;

        if (isLegacyFund || isSourceFund || isDestinationFund) {
          // Convert Firestore Timestamp to JavaScript Date
          const jsDate = data.date ? (data.date as any).toDate() : new Date();

          transactions.push({
            id: doc.id,
            ...data,
            date: jsDate
          } as Transaction);

          console.log(`Added transaction ${doc.id} to results`);
        }
      } catch (error) {
        console.error(`Error processing transaction ${doc.id}:`, error);
      }
    });

    // Sort by date (newest first)
    transactions.sort((a, b) => b.date.getTime() - a.date.getTime());

    console.log(`Returning ${transactions.length} filtered transactions for fund ${fundId}`);
    return transactions;
  } catch (error) {
    console.error('Error getting transactions by fund:', error);
    return []; // Return empty array on error
  }
};

export const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
  console.log('addTransaction function called with data:', JSON.stringify(transaction));

  try {
    // Create a new document reference
    const newDocRef = doc(transactionsCollection);
    console.log('Created new document reference with ID:', newDocRef.id);

    // Create a plain object with all the transaction data
    const plainTransaction: any = {
      amount: transaction.amount,
      type: transaction.type,
      description: transaction.description,
      // Convert Date to Firestore Timestamp
      date: Timestamp.fromDate(transaction.date)
    };

    // Add partnerId if provided
    if (transaction.partnerId) {
      plainTransaction.partnerId = transaction.partnerId;
    }

    // Add paymentMethod if provided
    if (transaction.paymentMethod) {
      plainTransaction.paymentMethod = transaction.paymentMethod;
      console.log(`Transaction payment method: ${transaction.paymentMethod}`);
    }

    // Handle different transaction types and fund fields
    if (transaction.type === 'transfer') {
      // For transfers, we need both source and destination funds
      if (!transaction.sourceFundId || !transaction.destinationFundId) {
        throw new Error('Transfer transactions require both sourceFundId and destinationFundId');
      }
      plainTransaction.sourceFundId = transaction.sourceFundId;
      plainTransaction.destinationFundId = transaction.destinationFundId;
      console.log(`Transfer from fund ${transaction.sourceFundId} to fund ${transaction.destinationFundId}`);
    } else if (transaction.type === 'deposit') {
      // For deposits, we need the destination fund
      if (!transaction.destinationFundId && !transaction.fundId) {
        throw new Error('Deposit transactions require a destinationFundId');
      }
      plainTransaction.destinationFundId = transaction.destinationFundId || transaction.fundId;
      console.log(`Deposit to fund ${plainTransaction.destinationFundId}`);
    } else if (transaction.type === 'withdrawal') {
      // For withdrawals, we need the source fund
      if (!transaction.sourceFundId && !transaction.fundId) {
        throw new Error('Withdrawal transactions require a sourceFundId');
      }
      plainTransaction.sourceFundId = transaction.sourceFundId || transaction.fundId;
      console.log(`Withdrawal from fund ${plainTransaction.sourceFundId}`);
    } else {
      // For backward compatibility
      if (transaction.fundId) {
        plainTransaction.fundId = transaction.fundId;
        console.log(`Legacy transaction for fund ${transaction.fundId}`);
      }
    }

    console.log('Prepared transaction data:', plainTransaction);

    // Add the ID to the transaction object
    const newTransaction = {
      ...plainTransaction,
      id: newDocRef.id
    };
    console.log('Final transaction object with ID:', newTransaction.id);

    // Save to Firestore
    console.log('Saving to Firestore...');
    try {
      await setDoc(newDocRef, plainTransaction);
      console.log('Successfully saved to Firestore');
    } catch (saveError) {
      console.error('Error saving to Firestore:', saveError);
      throw saveError;
    }

    // Return the transaction with a JavaScript Date
    return {
      ...newTransaction,
      date: transaction.date
    } as Transaction;
  } catch (error) {
    console.error('Error in addTransaction function:', error);
    throw error; // Re-throw to handle in the calling function
  }
};

// Inventory
export const inventoryCollection = collection(db, 'inventory');

export const getInventoryItems = async (): Promise<InventoryItem[]> => {
  const snapshot = await getDocs(inventoryCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
};

export const getInventoryItem = async (id: string): Promise<InventoryItem | null> => {
  const docRef = doc(inventoryCollection, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as InventoryItem : null;
};

export const addInventoryItem = async (item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> => {
  const newDocRef = doc(inventoryCollection);
  const newItem = { ...item, id: newDocRef.id };
  await setDoc(newDocRef, newItem);
  return newItem;
};

export const updateInventoryItem = async (id: string, data: Partial<InventoryItem>): Promise<void> => {
  const docRef = doc(inventoryCollection, id);
  await updateDoc(docRef, data);
};

// Purchases
export const purchasesCollection = collection(db, 'purchases');

export const getPurchases = async (): Promise<Purchase[]> => {
  const snapshot = await getDocs(purchasesCollection);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: (doc.data().date as any).toDate()
  } as Purchase));
};

export const getPurchase = async (id: string): Promise<Purchase | null> => {
  const docRef = doc(purchasesCollection, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    date: (data.date as any).toDate()
  } as Purchase;
};

export const getPurchasesByDateRange = async (startDate: Date, endDate: Date): Promise<Purchase[]> => {
  const q = query(
    purchasesCollection,
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: (doc.data().date as any).toDate()
  } as Purchase));
};

export const addPurchase = async (purchase: Omit<Purchase, 'id'>): Promise<Purchase> => {
  console.log('addPurchase function called with data:', JSON.stringify(purchase));

  try {
    const newDocRef = doc(purchasesCollection);
    console.log('Created new document reference with ID:', newDocRef.id);

    // Convert JavaScript Date to Firestore Timestamp
    const purchaseWithTimestamp = {
      ...purchase,
      date: Timestamp.fromDate(purchase.date)
    };
    console.log('Converted date to Firestore Timestamp');

    const newPurchase = { ...purchaseWithTimestamp, id: newDocRef.id };
    console.log('Prepared new purchase object with ID:', newPurchase.id);

    console.log('Saving to Firestore...');
    await setDoc(newDocRef, newPurchase);
    console.log('Successfully saved to Firestore');

    // Convert back to JavaScript Date for the return value
    const result = {
      ...newPurchase,
      date: purchase.date
    };
    console.log('Returning purchase with JavaScript Date');
    return result;
  } catch (error) {
    console.error('Error in addPurchase function:', error);
    throw error; // Re-throw to handle in the calling function
  }
};

export const updatePurchase = async (id: string, data: Partial<Purchase>): Promise<void> => {
  const docRef = doc(purchasesCollection, id);

  // Convert JavaScript Date to Firestore Timestamp if date is provided
  const dataToUpdate = { ...data };
  if (dataToUpdate.date) {
    dataToUpdate.date = Timestamp.fromDate(dataToUpdate.date as Date) as any;
  }

  await updateDoc(docRef, dataToUpdate);
};

export const deletePurchase = async (id: string): Promise<void> => {
  const docRef = doc(purchasesCollection, id);
  await deleteDoc(docRef);
};

// Sales
export const salesCollection = collection(db, 'sales');

export const getSales = async (): Promise<Sale[]> => {
  const snapshot = await getDocs(salesCollection);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: (doc.data().date as any).toDate()
  } as Sale));
};

export const addSale = async (sale: Omit<Sale, 'id'>): Promise<Sale> => {
  console.log('addSale function called with data:', JSON.stringify(sale));

  try {
    const newDocRef = doc(salesCollection);
    console.log('Created new document reference with ID:', newDocRef.id);

    // Convert JavaScript Date to Firestore Timestamp
    const saleWithTimestamp = {
      ...sale,
      date: Timestamp.fromDate(sale.date)
    };
    console.log('Converted date to Firestore Timestamp');

    const newSale = { ...saleWithTimestamp, id: newDocRef.id };
    console.log('Prepared new sale object with ID:', newSale.id);

    console.log('Saving to Firestore...');
    await setDoc(newDocRef, newSale);
    console.log('Successfully saved to Firestore');

    // Convert back to JavaScript Date for the return value
    const result = {
      ...newSale,
      date: sale.date
    };
    console.log('Returning sale with JavaScript Date');
    return result;
  } catch (error) {
    console.error('Error in addSale function:', error);
    throw error; // Re-throw to handle in the calling function
  }
};

export const getSalesByDateRange = async (startDate: Date, endDate: Date): Promise<Sale[]> => {
  const q = query(
    salesCollection,
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate)),
    orderBy('date', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: (doc.data().date as any).toDate()
  } as Sale));
};

export const getSale = async (id: string): Promise<Sale | null> => {
  const docRef = doc(salesCollection, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    date: (data.date as any).toDate()
  } as Sale;
};

export const updateSale = async (id: string, data: Partial<Sale>): Promise<void> => {
  const docRef = doc(salesCollection, id);

  // Convert JavaScript Date to Firestore Timestamp if date is provided
  const dataToUpdate = { ...data };
  if (dataToUpdate.date) {
    dataToUpdate.date = Timestamp.fromDate(dataToUpdate.date as Date) as any;
  }

  await updateDoc(docRef, dataToUpdate);
};

export const deleteSale = async (id: string): Promise<void> => {
  const docRef = doc(salesCollection, id);
  await deleteDoc(docRef);
};

// Profit Distributions
export const profitDistributionsCollection = collection(db, 'profitDistributions');

export const getProfitDistributions = async (): Promise<ProfitDistribution[]> => {
  const snapshot = await getDocs(profitDistributionsCollection);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: (doc.data().date as any).toDate()
  } as ProfitDistribution));
};

export const addProfitDistribution = async (distribution: Omit<ProfitDistribution, 'id'>): Promise<ProfitDistribution> => {
  const newDocRef = doc(profitDistributionsCollection);
  const newDistribution = { ...distribution, id: newDocRef.id };
  await setDoc(newDocRef, newDistribution);
  return newDistribution;
};
