const fs = require('fs');

module.exports = (function() {
  const _setSchema = function(schemaObj) {
    /* This schemObj needs to define what should exist in a db 
        [
          {
            'field_name':<name>,
            'onRead':function() {},
            'onWrite':function() {}
          }
        ]
    */

  }

  // The constructor. Invoke with = new TxtDb(configObj);
  function TxtDb(configObj) {
    this.myName = configObj.dbName || "txtDb";
    this.idField = configObj.idField || "id";
    this.dbFile = configObj.dbFile || false;
    this.db = configObj.db || [];
    this.verificationFunctions = {};
    this.schema = _setSchema(configObj.schema) || false;

    this.addVerification = (field,func) => {
      if(!field) return false;
      if(typeof func !== 'function') return false;
      this.verificationFunctions[field] = func;
      return true;
    };
    this.length = () => {
      let methodName = "length";
      console.log(`${methodName}: Getting length of DB`);
      return this.db.length;
    };
    this.nextId = () => {
      let methodName = "nextId";
      // This assumes that the records where added sequentially,
      // let x = this.db.length;
      let x = 0;
      while(this.find(this.idField,x).length>0) {
        console.log(`${methodName}: Checking ID: ${x}`);
        x++;
      }
      return x;  
    };
    this.find = (field,val) => {
      let methodName = "find";
      console.log(`${this.myName}: ${methodName}: Searching: ${field} for: ${val}`);
      let recordList = this.db.filter(function(record) {
        return record[field]==val;
      },this);
      return recordList;
    };
    this.findById = (id) => {
      let methodName = 'findById';
      console.log(`Finding record with id: ${id}`);
      let record = this.db.find(function(record) {
        return record[this.idField]==id;
      },this);
      return (record!==undefined) ? record : false;
    };
    this.verify = (field,data) => {
      if(this.verificationFunctions.hasOwnProperty(field)) {
        for(var c=0;c<this.verificationFunctions[field].length;c++) {
          
        }
        return this.verificationFunctions[field](data);
      }
      return data;
    }
    this.add = (record) => {
      let methodName = 'add';
      let thisId;
      if(!record) return false;
      console.log("! " + JSON.stringify(record));
      if(!record.hasOwnProperty(this.idField)) {
        console.log("No id in record object. Creating...");
        thisId = this.nextId();
        console.log(`Assigned: ${thisId}`);
      } else {
        console.log("This record want to have ID: " + record[this.idField]);
        if(this.findById(record[this.idField])) return false;
        thisId = record[this.idField];
      }
      let thisRecord = {};
      for(field in record) {
        if(record.hasOwnProperty(field)) {
          thisRecord[field] = this.verify(field,record[field]);
        }
      }
      if(!thisRecord.hasOwnProperty(this.idField)) {
        thisRecord[this.idField] = thisId;
      }
      console.log(`${methodName}: Pushing record: ${thisId} ${JSON.stringify(thisRecord)}`);
      
      this.db.push(thisRecord);
      return thisId;
    };
    this.search = (field,searchObj) => {
      let results = this.db.filter(function(itemRecord) {
        let targetString = itemRecord.id.toLowerCase() + " " + itemRecord.owner.toLowerCase();
        return targetString.includes(searchObj);
      });
      return results;
    };
    this.readDb = (fileLocation) => {
      let methodName = "readDb";
      fileLocation = fileLocation || this.dbFile;
      console.log(`${this.myName}: ${methodName}: Attempting read of stored data from ${fileLocation}`);
      fs.readFile(fileLocation,'utf8',function(err,data) {
        if(err) throw err;
        console.log("Read file!");
        this.db = JSON.parse(data);
        console.log(this.db);
        return true;
      }.bind(this));
      return;
    };
    this.writeDb = (fileLocation) => {
      let methodName = "writeDb";
      console.log(`${this.myName}: ${methodName}: Attempting write of in-memory data...`);
      fileLocation = fileLocation || this.dbFile;
      if(!fileLocation) return false;
      fs.writeFile(fileLocation,JSON.stringify(this.db),function(err) {
        if(err) {
          console.log(`${this.myName}: ${methodName}: Seems there was an error`);
          throw err;
        }
        console.log(`${this.myName}: ${methodName}: Write success!`);
      }.bind(this));
      return;
    };  
  }
  return TxtDb;
})();