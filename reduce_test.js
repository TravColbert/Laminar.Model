let list = [];

let addValue = (value) => {
  let nextId = list.reduce((accumulator,currentRecord) => {
    if(!currentRecord.hasOwnProperty("id")) {
      console.log("No 'id' field: " + accumulator);
      return accumulator;
    }
    if(currentRecord.id==accumulator) return ++accumulator;
  });
  console.log(nextId);
}

