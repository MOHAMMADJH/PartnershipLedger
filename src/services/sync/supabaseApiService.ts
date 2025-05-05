import { supabase } from '../supabase/client';
import { isOnline } from '../network/networkService';
import {
  savePendingOperation,
  PendingOperationInput // Import the correct input type
} from '../storage/localStorageService';

// Type representing the outcome of an operation attempt
export type OperationResult = { success: true } | { success: false; queued: boolean; error?: any };

/**
 * Attempts to execute a Supabase operation directly if online,
 * otherwise queues it for later synchronization.
 *
 * @param operation The operation details (type, entity, payload, id - id is optional here).
 * @returns Promise<OperationResult> Outcome of the attempt.
 */
export const executeOrQueueOperation = async (
  operationInput: PendingOperationInput // Use the correct input type
): Promise<OperationResult> => {
  if (await isOnline()) {
    try {
      console.log(`Online: Attempting to execute operation: ${operationInput.type} ${operationInput.entity}`);
      let error: any;
      let data: any;

      const payload = operationInput.payload;
      const entity = operationInput.entity;
      const type = operationInput.type;
      const id = operationInput.id; // id might be undefined for insert

      // Map operation to Supabase function call
      switch (type) {
        case 'insert':
          ({ data, error } = await supabase
            .from(entity)
            .insert(payload)
            .select()
            .single()); // Assuming single insert for simplicity
          break;
        case 'update':
          if (!id) {
            // This case should ideally not happen if called correctly,
            // as update operations typically need an ID passed in operationInput.
            console.error('Update operation called without an ID in input.');
            throw new Error('Update operation requires an ID.');
          }
          ({ error } = await supabase
            .from(entity)
            .update(payload)
            .eq('id', id));
          break;
        case 'delete':
          if (!id) {
            console.error('Delete operation called without an ID in input.');
            throw new Error('Delete operation requires an ID.');
          }
          ({ error } = await supabase
            .from(entity)
            .delete()
            .eq('id', id));
          break;
        default:
          // This handles potential incorrect type values if PendingOperationInput['type'] changes
          const exhaustiveCheck: never = type;
          throw new Error(`Unsupported operation type: ${exhaustiveCheck}`);
      }

      if (error) {
        console.error(`Supabase operation failed: ${type} ${entity}`, error);
        // Optionally queue even if online fails due to transient issue or RLS
        // For now, we treat online failure as immediate failure
        // await savePendingOperation(operationInput); 
        // return { success: false, queued: true, error };
        return { success: false, queued: false, error };
      }

      console.log(`Supabase operation successful: ${type} ${entity}`);
      // For inserts, 'data' might contain the newly created record with its ID
      // which could be useful for updating UI state immediately.
      // We might need to enhance OperationResult to return this data.
      return { success: true }; 

    } catch (err) {
      console.error(`Error executing Supabase operation: ${operationInput.type} ${operationInput.entity}`, err);
      return { success: false, queued: false, error: err };
    }
  } else {
    // Offline: Queue the operation
    try {
      console.log(`Offline: Queuing operation: ${operationInput.type} ${operationInput.entity}`);
      // Pass the original input object to savePendingOperation
      await savePendingOperation(operationInput);
      return { success: false, queued: true };
    } catch (queueError) {
      console.error(`Error queuing operation: ${operationInput.type} ${operationInput.entity}`, queueError);
      return { success: false, queued: false, error: queueError };
    }
  }
};
