const TxtDb = require('./TxtDb.js');
const testDb = new TxtDb({
  dbName:"test"
});

const fruitDb = new TxtDb({
  dbName:"fruit"
});

let testResults = {};

// firstIdCheck
testResults.firstIdCheck = (testDb.nextId()==0);

// firstRecord
let newRecord = {
  id:2,
  name:"apple",
  color:"red"
};
// We've given the ID of record in the object. txtDb tries to honor that.
// The result of the add() should be 2
testResults.firstRecord = (testDb.add(newRecord)==2);

// idConflictCheck
let nextRecord = {
  id:2,
  name:"orange",
  color:"orange"
}
// Let's say we try to add another record with the same ID. txtDb should 
// reject it with 'false'
testResults.idConflictCheck = (testDb.add(nextRecord)==false);

// idNotGivenCheck
nextRecord = {
  name:"Cherry",
  color:"red"
}
/* So, let's try to add a record with no ID given. This is the normal way
 * you'd probably add a record. txtDb will try to find the lowest, non-clashing
 * ID. In this case, it should be 1 since 0 is already used and we implicitly
 * assigned another record with ID=2.
 */
testResults.idNotGivenCheck = (testDb.add(nextRecord)==0);

// nextIdGeneratedCheck
nextRecord = {
  name:"orange",
  color:"orange"
}
/* We do it again, adding a record with no ID specified
 * This should return 1 since 0 is used and 2 is used.
 */
testResults.nextIdGeneratedCheck = (testDb.add(nextRecord)==1);

// thirdIdGeneratedCheck
nextRecord = {
  name:"grapefruit",
  color:"orange"
}
/* Once last time, adding a record with no ID specified
 * This should return 3 since 0, 1 and 2 are used.
 */
console.log("== " + JSON.stringify(nextRecord));
testResults.thirdIdGeneratedCheck = (testDb.add(nextRecord)==3);
console.log("== " + JSON.stringify(nextRecord));

// addEmptyRecord
testResults.addEmptyRecord = (testDb.add()==false);

// findText
testResults.findText = (testDb.find("name","Cherry")[0].name=="Cherry");

// findTextMultipleRecords
testResults.findTextMultipleRecords = (testDb.find("color","red").length==2);

// findRecordById
testResults.findRecordById = (testDb.findById(1).name=="orange");

/* Get the number of records in the DB
 * This should be 0 for our empty fruit database.
 */
testResults.fruitDbEmpty = (fruitDb.length()==0);
testResults.addFruitRecord = (fruitDb.add(nextRecord)==0);
testResults.findFruitById = (fruitDb.findById(0).name=="grapefruit");

console.log(testDb);
console.log(fruitDb);
console.log(testResults);