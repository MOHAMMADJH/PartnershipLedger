// Test script to verify interop functions
console.log('Testing interop functions...');

// Load the central interop definition
const interopHelpers = require('./interop-single-source');

// Check if the interop functions are properly defined
console.log('_interopRequireDefault defined:', typeof global._interopRequireDefault === 'function');
console.log('_interopRequireDefault2 defined:', typeof global._interopRequireDefault2 === 'function');

// Test the interop functions
const testObj = { __esModule: true, default: 'test' };
console.log('_interopRequireDefault test:', global._interopRequireDefault(testObj) === testObj);
console.log('_interopRequireDefault2 test:', global._interopRequireDefault2(testObj) === testObj);

// Check if they are the same function
console.log('Functions are the same:', global._interopRequireDefault === global._interopRequireDefault2);

console.log('Test completed successfully!');
