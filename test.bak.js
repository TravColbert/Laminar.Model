const Laminar = require('./laminar.model.node.js');

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

userDb.push(userRecord);

console.log(userDb[0]);

delete userRecord.password;

try {
  userDb.push(userRecord);
} catch(e) {
  console.log("Value not set");
}

console.log(userDb);

userRecord.test = "Hi there!";

console.log(userDb);

userDb.push({
  username:"jimmy",
  email:"jones@dataimpressions.com",
  password:"mypassword"
});

userDb.save = function() {
  console.log("Saving:",JSON.stringify(userDb));
}

console.log(userDb);

console.log("Ok... let's save this DB");
let saveDb = function(property) {
  if(property=="length") return;
  console.log("Saving:",property,":",userDb[property]);
}
userDb.__save(saveDb);

console.log("Get some values");
userDb.forEach(function(v,i,a) {
  console.log(i,v.username);
});
for(var c=0;c<userDb.length;c++) {
  console.log(c,userDb[c].username);
}

var dbContents = JSON.stringify(userDb.__save());
console.log("Here is the DB now:");
console.log(dbContents);
console.log("Now, let's create another DB");

var aDbHandlerFunctionObj = {};
// This creates a new Laminar model obj (array) with a handler object that we 
// can add handler functions to.
// vvv this will create a model with a bunch of SET triggers in place already
var aDb = Laminar.createModel(JSON.parse(dbContents),userDbHandlerFunctionObj,true);
// vvv this will create a model with no SET triggers
// var aDb = Laminar.createModel(JSON.parse(dbContents),aDbHandlerFunctionObj,true);

var testDbHandlerFunctionObj = {};
// This creates a new Laminar model obj (array) with a handler object that we 
// can add handler functions to
var testDb = Laminar.createModel([ { username: 'travis',
email: 'travis@dataimpressions.com',
password: 'HASHED:this is a test',
timestamp: 1511306623186 },
{ username: 'jimmy',
email: 'jones@dataimpressions.com',
password: 'HASHED:mypassword',
timestamp: 1511306623190 } ],testDbHandlerFunctionObj,true);

console.log("** Result:\n",testDb);
console.log("** Result:\n",aDb);

aDb.push({
  username:"Tom",
  email: "tommy@dataimpressions.com",
  password: "test123!"
});
console.log("Results:\n",aDb);

console.log("** Set an individual property 'username=Nannette'");
aDb[0].username = "Nannette";
console.log("Results:\n",aDb);

console.log("** Create a 'custom' function 'find'");
aDb.addMethod("find",function(k,v) {
  let records = this.filter(function(record) {
    return record[k]==v;
  });
  return records;
});

console.log("** Invoking 'find(username,Tom)'");
let foundRecords = aDb.find("username","Tom");
console.log("** Result:\n",foundRecords[0]);

console.log("** Let's add some CRUD-style functions");
aDb.addMethod("add",function(value) {
  console.log("This is my new little add function!");
  console.log(value);
  this.push(value);
});

console.log("** Add a new user called 'Joe':");
aDb.add({
  username:"Joe",
  email:"joe@dataimpressions.com",
  password:"1111"
});

console.log("** Results:\n",aDb);

console.log("** Add a new user called 'Timmy' but 'username' is missing:");
aDb.add({
  email:"timmy@dataimpressions.com",
  password:"2222"
})

console.log("** Result:\n",aDb);