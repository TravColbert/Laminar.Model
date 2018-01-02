const test = require('tape');
const Laminar = require('./laminar.model.node.js');

let baseDb,
    baseDbHandlerFunctionObj;

let userDb, 
    userDbHandlerFunctionObj;

let testRecord = {
  username:"Clark",
  email:"ClarkKent@DailyPlanet.com",
  password:"kryptonite"
}

let userRecord = {
  username:"travis",
  email:"travis@dataimpressions.com",
  password:"this is a test"
}

test('Create a basic Laminar Model', (t) => {
  baseDbHandlerFunctionObj = {};
  baseDb = Laminar.createModel([],baseDbHandlerFunctionObj);
  t.ok(baseDb.__isLaminarModel(),"isLaminarModel() should be true");
  baseDb.push(testRecord);
  t.is(baseDb[0].username,"Clark","Should equal 'Clark'");
  t.end();
});

test('Augment "set" trigger for basic Laminar Model', (t) => {
  /* Let's make it so that each added record creates a 'key/ID' field
   * This is something quite typical in databases, right?
   * 
   * This is going to be a 'set' trigger. Functions triggered by a 'set'
   * will want at least 3 params: <target_object>,<property>,<value>.
   * 
   * Let's make the function first...
   */
  let generateRecordId = (target,property,value) => {
    /* Unfortunately, we always have to test if Javascript is automatically
     * manipulating the 'length' property in an Array-like object. If so we
     * just return the value and move on...
     */
    if(Array.isArray(target) && property=="length") return value;

    value.id = (function(){
      let l = target.length;
      while(target.filter(function(record){
        if(!record.hasOwnProperty("id")) return false;
        return record.id==l;
      }).length>0) { l++; }
      return l;
    })();

    return value;
  }

  /* Now, let's add this function to the queue of functions that get run when
   * a 'set' is performed on our DB. (a push() will trigger a 'set')
   */
  baseDbHandlerFunctionObj.addHandler("set",generateRecordId);
  /* Done! 
   * Now, let's add another record and see what happens...
   */
  baseDb.push({
    username:"JJ",
    email:"JJEvans@GoodTimes.com",
    password:"dynomite!"
  });
  /* Notice that we did not specify an 'id' field in the object above. Our little
   * 'set' function should have done it for us... and generated a 1 (since there 
   * should already be a 'Clark Kent' record there)
   * Let's test for that...
   */
  t.is(baseDb[1].id,1,"Should be '1'");
  t.is(baseDb.length,2,"Length should be 2");
  t.comment(JSON.stringify(baseDb[1]));
  baseDb.push({
    username:"Fred",
    email:"Fred@SanfordAndSon.com",
    password:"Ethel!"
  });
  t.is(baseDb[2].id,2,"Should be '2'");
  t.comment(JSON.stringify(baseDb));
  t.end();
});


test('Create a new Laminar Model', (t) => {
  userDbHandlerFunctionObj = {};
  // This creates a new Laminar model obj (array) with a handler object that we 
  // can add handler functions to
  // var userDb = Laminar.createModel([],userDbHandlerFunctionObj,true);
  // ^^^ The 'true' at the end say: show all debug logs
  // vvv No 'debug' logs
  userDb = Laminar.createModel([],userDbHandlerFunctionObj);

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

  // This one adds a timestamp field
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