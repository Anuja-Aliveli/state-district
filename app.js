const express = require("express");
const path = require("path");

const {open} = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeAndConnect = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database,
        });
        app.listen(3000, () => {
            console.log("server running at port 3000");
            console.log("Database sqlite connected...");
        });
    }
    catch (err) {
        console.log(`Db err ${err.message}`);
        process.exit(1);
    }
}
initializeAndConnect();

// API 1 
app.get("/states/", async (request, response) => {
    const query1 = `select * from state order by state_id;`;
    const stateArray = await db.all(query1);
    const convert = (dbState) => {
        return {
            stateId: dbState.state_id,
            stateName: dbState.state_name,
            population: dbState.population
        };
    };
    response.send(stateArray.map( (eachState) => convert(eachState) ) );
});

// API 2 
app.get("/states/:stateId/", async (request, response) => {
    const {stateId} = request.params;
    const query2 = `select * from state where state_id = ${stateId};`; 
    const stateDetails = await db.get(query2);
    const newObj = {stateId: stateDetails.state_id,
                     stateName: stateDetails.state_name,
                     population: stateDetails.population}; 
    response.send(newObj);
});

// API 3 
app.post("/districts/", async (request, response) => {
    const districtDetails = request.body;
    const {districtName,stateId,cases,cured,active,deaths} = districtDetails;
    const query3 = `INSERT INTO 
                     district(district_name,state_id,cases,cured,active,deaths)
                     VALUES 
                     ('${districtName}','${stateId}','${cases}','${cured}','${active}','${deaths}');`;
    const dbResponse = await db.run(query3);
    response.send("District Successfully Added");
});

// API 4 
app.get("/districts/:districtId/", async (request, response) => {
    const { districtId } = request.params;
    const query4 = `select * from district where district_id = ${districtId};`;
    const singleDistrictDetails = await db.get(query4);
    const newDistrict = {
        districtId: singleDistrictDetails.district_id,
        districtName: singleDistrictDetails.district_name,
        stateId: singleDistrictDetails.state_id,
        cases: singleDistrictDetails.cases,
        cured: singleDistrictDetails.cured,
        active: singleDistrictDetails.active,
        deaths: singleDistrictDetails.deaths
    };
    response.send(newDistrict);
});

// API 5 
app.delete("/districts/:districtId/", async (request, response) => {
    const { districtId } = request.params;
    const query5 = `delete from district where district_id = ${districtId};`;
    await db.run(query5);
    response.send("District Removed");
});

// API 6 
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const updateDetails = request.body;
  const {districtName,stateId,cases,cured,active,deaths} = updateDetails;
  const query6 = `
    UPDATE
      district
    SET
      district_name = '${districtName}',
      state_id = '${stateId}',
      cases = '${cases}',
      cured = '${cured}',
      active = '${active}',
      deaths = '${deaths}'
    WHERE
      district_id = ${districtId};`;
  await db.run(query6);
  response.send("District Details Updated");
});

// API 7 
app.get("/states/:stateId/stats/", async (request, response) => {
    const { stateId } = request.params;
    const query7 = `select 
                    SUM(cases) as totalCases,
                    SUM(cured) as totalCured,
                    SUM(active) as totalActive,
                    SUM(deaths) as totalDeaths
                    FROM district WHERE state_id = ${stateId};`;
    const totalSum = await db.get(query7);
    response.send(totalSum);           
});

// API 8 
app.get("/districts/:districtId/details/", async (request, response) => {
    const {districtId} = request.params;
    const query8 = `select state_name from state 
                     NATURAL JOIN district
                     where district.district_id = ${districtId};`;    
    const result = await db.get(query8);
    const newResult = {stateName: result.state_name};
    response.send(newResult);
});

module.exports = app;