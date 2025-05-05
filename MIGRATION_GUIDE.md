# Migration Guide: Firebase to Supabase

This guide explains how to migrate your Partnership Ledger application from Firebase to Supabase.

## What Has Been Done

1. **Supabase Project Created**: A new Supabase project has been set up with the following details:
   - Project URL: https://pzrinmnxnejwmadmneup.supabase.co
   - Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6cmlubW54bmVqd21hZG1uZXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyNTg4NTksImV4cCI6MjA2MTgzNDg1OX0.hevole73Hr3XW-yg8QFrhSlQcpDDb8Li6b4dBgoMeoQ`

2. **Database Schema Created**: The following tables have been created in Supabase:
   - `partners`: For storing partner information
   - `funds`: For managing different funds (cash, bank, personal)
   - `transactions`: For recording financial transactions
   - `inventory_items`: For tracking inventory
   - `purchases` and `purchase_items`: For managing purchases
   - `sales` and `sale_items`: For managing sales
   - `profit_distributions` and `partner_distributions`: For profit sharing

3. **Helper Functions and Triggers**: Database functions and triggers have been created to:
   - Automatically update timestamps
   - Update fund balances after transactions
   - Update partner capital when fund balances change
   - Update inventory quantities and costs
   - Calculate profits on sales

4. **Views Created**: Several views have been created for easier data access:
   - `partner_summary`
   - `inventory_summary`
   - `transaction_summary`
   - `purchase_summary`
   - `sale_summary`
   - `profit_distribution_summary`

5. **API Functions**: Stored procedures have been created for complex operations:
   - `get_transactions_by_fund`: Get transactions for a specific fund
   - `add_transaction`: Add a transaction and update fund balances
   - `add_purchase`: Add a purchase with items and update inventory
   - `add_sale`: Add a sale with items and update inventory
   - `add_profit_distribution`: Add a profit distribution with partner shares

6. **Supabase Service File**: A new `supabase.ts` file has been created to replace the Firebase services.

## Steps to Complete the Migration

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Data Migration**:
   To migrate your existing data from Firebase to Supabase, you'll need to:

   a. Export your Firebase data:
   ```javascript
   // Create a script like migrate-data.js
   import { getPartners, getFunds, getTransactions, getInventoryItems, getPurchases, getSales, getProfitDistributions } from './src/services/firestore';
   import fs from 'fs';

   async function exportData() {
     const partners = await getPartners();
     const funds = await getFunds();
     const transactions = await getTransactions();
     const inventoryItems = await getInventoryItems();
     const purchases = await getPurchases();
     const sales = await getSales();
     const profitDistributions = await getProfitDistributions();

     const data = {
       partners,
       funds,
       transactions,
       inventoryItems,
       purchases,
       sales,
       profitDistributions
     };

     fs.writeFileSync('firebase-export.json', JSON.stringify(data, null, 2));
     console.log('Data exported successfully!');
   }

   exportData();
   ```

   b. Import the data into Supabase using the new service functions:
   ```javascript
   // Create a script like import-data.js
   import fs from 'fs';
   import { addPartner, addFund, addTransaction, addInventoryItem, addPurchase, addSale, addProfitDistribution } from './src/services/supabase';

   async function importData() {
     const data = JSON.parse(fs.readFileSync('firebase-export.json', 'utf8'));

     // Import partners
     for (const partner of data.partners) {
       await addPartner(partner);
     }

     // Import funds
     for (const fund of data.funds) {
       await addFund(fund);
     }

     // Import inventory items
     for (const item of data.inventoryItems) {
       await addInventoryItem(item);
     }

     // Import transactions
     for (const transaction of data.transactions) {
       await addTransaction(transaction);
     }

     // Import purchases
     for (const purchase of data.purchases) {
       await addPurchase(purchase);
     }

     // Import sales
     for (const sale of data.sales) {
       await addSale(sale);
     }

     // Import profit distributions
     for (const distribution of data.profitDistributions) {
       await addProfitDistribution(distribution);
     }

     console.log('Data imported successfully!');
   }

   importData();
   ```

3. **Update Imports in Your Components**:
   Replace all imports from `./services/firebase` and `./services/firestore` with imports from `./services/supabase`.

4. **Authentication**:
   Supabase provides authentication similar to Firebase. If you're using authentication, you'll need to:
   
   a. Set up authentication in the Supabase dashboard
   b. Replace Firebase auth with Supabase auth in your code

5. **Testing**:
   Test all functionality to ensure the migration was successful:
   - Partner management
   - Fund operations
   - Transactions
   - Inventory management
   - Purchases and sales
   - Profit distributions

## Benefits of Supabase

1. **PostgreSQL Database**: Supabase uses PostgreSQL, which is more powerful and flexible than Firestore.
2. **Real-time Subscriptions**: Like Firebase, Supabase supports real-time data updates.
3. **Row-Level Security**: Supabase provides powerful security rules at the database level.
4. **SQL Support**: You can use full SQL for complex queries and operations.
5. **Built-in Functions**: Triggers and stored procedures make data operations more reliable.
6. **Lower Costs**: Supabase often has more favorable pricing compared to Firebase.

## Troubleshooting

If you encounter issues during the migration:

1. **Check Console Errors**: Look for error messages in the browser console or terminal.
2. **Verify Credentials**: Ensure the Supabase URL and anon key are correctly set.
3. **Data Types**: Check for data type mismatches between Firebase and Supabase.
4. **Date Handling**: Ensure dates are properly converted between formats.
5. **Supabase Dashboard**: Use the Supabase dashboard to inspect data and run queries.

For additional help, refer to the [Supabase documentation](https://supabase.com/docs) or [contact support](https://supabase.com/support).
