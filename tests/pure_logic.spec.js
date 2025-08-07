/**
 * @file pure_logic.spec.js
 * @description This file demonstrates how to unit test pure, non-browser-dependent functions from the extension's codebase.
 * To run this, you could use a test runner like Jest or simply execute it with Node.js.
 * For more complex testing involving Chrome APIs, a mocking framework like jest-chrome is recommended.
 */

// Replicated from background.js for demonstration purposes.
// In a real test setup (e.g., with Jest), you would export this function and import it here.
function getWeekStartDate(date) {
  const today = new Date(date); // Allow passing a date for predictable testing
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(today.setDate(diff));
}

// Simple assertion helper
function assertEquals(expected, actual, message) {
  if (expected !== actual) {
    console.error(`Assertion Failed: ${message}`);
    console.error(`  - Expected: ${expected}`);
    console.error(`  - Actual:   ${actual}`);
    return false;
  }
  console.log(`Assertion Passed: ${message}`);
  return true;
}

// --- Test Cases ---

// Test case 1: A Wednesday
const wednesday = new Date('2023-11-15T10:00:00Z');
const expectedMonday = '2023-11-13T00:00:00.000Z';
let result = getWeekStartDate(wednesday).toISOString().split('T')[0] + 'T00:00:00.000Z';
assertEquals(expectedMonday, result, 'Test with a Wednesday should return the preceding Monday.');

// Test case 2: A Sunday
const sunday = new Date('2023-11-19T10:00:00Z');
const expectedMonday2 = '2023-11-13T00:00:00.000Z';
result = getWeekStartDate(sunday).toISOString().split('T')[0] + 'T00:00:00.000Z';
assertEquals(expectedMonday2, result, 'Test with a Sunday should return the preceding Monday.');

// Test case 3: A Monday
const monday = new Date('2023-11-20T10:00:00Z');
const expectedMonday3 = '2023-11-20T00:00:00.000Z';
result = getWeekStartDate(monday).toISOString().split('T')[0] + 'T00:00:00.000Z';
assertEquals(expectedMonday3, result, 'Test with a Monday should return the same Monday.');

console.log('\nTo run these tests, you can use Node.js: `node tests/pure_logic.spec.js`');
