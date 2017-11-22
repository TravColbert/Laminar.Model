const test = require('tape');
const Laminar = require('../Laminar.js/laminar.model.node.js');

var userDbHandlerFunctionObj = {};
// This creates a new Laminar model obj (array) with a handler object that we 
// can add handler functions to
// var userDb = Laminar.createModel([],userDbHandlerFunctionObj,true);
// ^^^ The 'true' at the end say: show all debug logs
// vvv No 'debug' logs
var userDb = Laminar.createModel([],userDbHandlerFunctionObj);

// Add some verification functions when we add a user:
// This one makes sure all properties are there:
userDbHandlerFunctionObj.addHandler("set",function(target,property,value,receiver) {
  if(Array.isArray(target) && property=="length") return value;
  console.log("This is setter function #1: VERIFY");
  // I want to hash the password here:
  if(!value.hasOwnProperty("password") || !value.hasOwnProperty("username") || !value.hasOwnProperty("email")) {
    console.log("Missing value. Punting");
    return;
  }
  return value;
});

// This one pretends to hash the password:
userDbHandlerFunctionObj.addHandler("set",function(target,property,value,receiver) {
  if(Array.isArray(target) && property=="length") return value;
  console.log("This is setter function #2: HASH");
  value.password = "HASHED:" + value.password;
  return value;
});

userDbHandlerFunctionObj.addHandler("set",function(target,property,value,receiver) {
  if(Array.isArray(target) && property=="length") return value;
  console.log("This is setter function #3: TIMESTAMP");
  value.timestamp = Date.now();
  return value;
});

// This is a CHANGE trigger that pretends to email you.
// CHANGE triggers don't have the ability to manipulate or 
let triggerEmail = function(target,property) {
  if(Array.isArray(target) && property=="length") return;
  console.log("CHANGE:",property," changed. Emailing the new value.",target[property]);
  return;
};

userDbHandlerFunctionObj.addHandler("change",triggerEmail);

var userRecord = {
  username:"travis",
  email:"travis@dataimpressions.com",
  password:"this is a test"
}

test('Create a new Laminar Model', (t) => {
  t.ok(userDb,"Laminar Model created");
  userDb.push(userRecord);
  t.end();
});

test('Set handlers work right', (t) => {
  t.equal("HASHED:this is a test",userDb[0].password,"Password should be HASHED");
  t.ok(userDb[0].hasOwnProperty("timestamp"),"Look for 'timestamp' property in db");
  t.end();
});

test('Access DB like a simple array', (t) => {
  t.equal(userDb[0].username,userRecord.username);
  t.end();
})

test('Verification handlers fail with error', (t) => {
  delete userRecord.username;
  t.ok(!userRecord.hasOwnProperty("username"),"New user object is badly-formed");
  t.throws(function() { userDb.push(userRecord) },"Badly-formed user object can't be added");
  t.end();
});

test('Add a second object', (t) => {
  let records = userDb.push({
    username:"jimmy",
    email:"jones@dataimpressions.com",
    password:"mypassword"
  });
  t.equal(records,2,"Records don't match how many should be in the DB");
  t.equal(userDb[--records].username,"jimmy",'Record does not match');
  t.equal(userDb[records].password,"HASHED:mypassword",userDb[0].password,"Password should be HASHED");
  t.end();
});