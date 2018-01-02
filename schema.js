#!/usr/bin/node
const fs = require('fs');
const https = require('https');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express();
const nodemailer = require('nodemailer');

// Laminar Schemas use Laminar Models
const Laminar = require('../Laminar.Model/laminar.model.node.js');

app.locals = JSON.parse(fs.readFileSync('config.json'));
app.locals.url = "https://" + app.locals.addr;
if(app.locals.port!="443") app.locals.url += ":" + app.locals.port;
const options = {
  key: fs.readFileSync(app.locals.keyFile),
  cert: fs.readFileSync(app.locals.certFile)
}
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
let sessionConfig = {
  secret:app.locals.sessionSecret,
  resave:false,
  saveUninitialized:false
};

/**
 * For mail capabilities
 */
let transporter = nodemailer.createTransport({
  host: app.locals.smtpServer,
  port: app.locals.smtpPort,
  secure: app.locals.smtpSecurity,
  ignoreTLS: true
});

/**
 * Configuration
 */
// Template Engine setup:
// No template engine here
// app.set('views',app.locals.viewsDir);
// app.set('view engine','pug');
app.set('query parser',true);
app.use(express.static(app.locals.staticDir));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());

/**
 * We want to DESCRIBE the data we're handling.
 * Based on that description the following occurs:
 *  MODEL is validated
 *  VIEWS are created to match model
 *  CONTROLLERS are created to support the model-view relationship
 * 
 * Schema's shall be an array of PROPERTIES
 * PROPERTIES shall be objects (dictionaries of properties describing the property)
 *  fieldname - the name of the field: "id","username","emailaddress" etc
 *  fieldtype - id, num, text, enum, bool
 *    id: unique ID in all of the database represented by the schema
 *    num: integer or decimal(?)
 *    text: general (do we support fixed-length or general?)
 *    enum: some kind of static list of values
 *    bool: true/false, 0/1, on/off etc
 *  fieldreqd - field entry is required
 *  fieldedit - field can be user-edited
 *  fieldvisible - is the field visible in views?
 */
let schemaUserSchema = [
  {
    "name":"id",
    "type":"id",
    "required":true,
    "edit":false,
    "visible":false
  },
  {
    "name":"username",
    "type":"text",
    "required":true,
    "edit":true,
    "visible":true
  },
  {
    "name":"age",
    "type":"num",
    "required":false,
    "edit":true,
    "visible":true
  },
  {
    "name":"enabled",
    "type":"bool",
    "required":false,
    "edit":true,
    "visible":true
  }
]

/**
 * Create the schema object based on the schema definition given above...
 */
let Schema = (function(){
  function Schema(schemaDef,name,source) {
    if(schemaDef===undefined) {
      console.log("No schema provided");
      this.error=true;
      return false;
    }
    if(!Array.isArray(schemaDef)) {
      console.log("Schema is not a list of fields");
      this.error=true;
      return false;
    }
    if(name!==undefined) {
      console.log("Setting name for schema");
      this.name = name;
    }
    if(source!==undefined) {
      console.log("Setting source for schema");
      this.source = source;
    }
    this.fields = {};
    for(let c=0;c<schemaDef.length;c++) {
      this.fields[schemaDef[c].name] = schemaDef[c];
    }
  }
  Schema.prototype.schemaHasErrors = function() {
    if(this.error) {
      console.log("Schema has errors. Can't continue!");
      return true;
    }
    return false;
  };
  Schema.prototype.init = function(data) {
  };
  Schema.prototype.getFields = function() {
    return Object.keys(this.fields);
  };
  Schema.prototype.view = function(template) {
    // format: json, html, xml etc...
    if(this.schemaHasErrors()) return false;
    let keys = Object.keys(this.fields);
    keys.forEach(function(v,i){
      console.log(v + "= " + this.fields[v].type);
    }.bind(this))
    console.log("Schema view created");
    return {};
  };
  Schema.prototype.save = function() {
    return true;
  };
  Schema.prototype.controller = function() {
    return {};
  };
  Schema.prototype.model = function(data) {
    // return an in-memory thing with setters and getters that accepts the fields defined in the schema    
    if(this.schemaHasErrors()) return false;

    let newModel =  Laminar.createModel();
    let newModelTriggerFunctions = newModel.__getHandlerObject();
    
    // Now, let's start adding our common, base trigger functions (getters and setters)
    
    // Lets build the DB. It will be a Laminar.Model
    // For each field we have to create the basic getters and setters...
    // console.log(this.getFields())
    this.getFields().forEach(function(v,i) {
      console.log(this.fields[v]);
      if(this.fields[v].type=="id") {
        console.log("Setting up trigger functions for ID field: '" + this.fields[v].name + "'");
        newModelTriggerFunctions.addHandler("set",(target,property,value) => {
          if(Array.isArray(target) && property=="id") {
            value.id = (function(){
              let l = target.length;
              while(target.filter(function(record){
                if(!record.hasOwnProperty("id")) return false;
                return record.id==l;
              }).length>0) { l++; }
              return l;
            })();
          }
          return value;
        })
      }
    }.bind(this));


    if(data!==undefined && data!==null) {
      // format provided data
      console.log("Setting model based on " + data);
    } else {
      // read data from source (if it exists)
      if(!this.source) {
        console.log("No source material provided");
        this.error=true;
        return false;
      }
      console.log("Setting model based on source: " + this.source);
    }
    console.log("Schema Object initialized");
    return {};
  }
  return Schema;
})();

// let users = new Schema(schemaUserSchema,"users","./usersdb.json");
let users = new Schema(schemaUserSchema,"users");
if(users.error) console.log("There was an error. We couldn't make the Schema object");
console.log(users);

/**
 * Now, let's initialize the MODEL based on the schema...
 * Is the model already there?
 * If not - make it
 * If yes - pull the data
 */
model = users.model();
users.view();
// users.save();

/**
 * Now, let's compose some routes that will either generate the VIEW, based on the schema
 * or work with the MODEL
 */