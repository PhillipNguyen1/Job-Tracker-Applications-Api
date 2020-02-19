"use strict";
const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: "us-east-1"
});
const uuid = require("uuid/v4");

const applicationsTable = process.env.APPLICATIONS_TABLE;

function successfulResponse(statusCode, message) {
  return {
    statusCode: statusCode,
    body: JSON.stringify(message)
  };
}

function failedResponse(statusCode, error) {
  return {
    statusCode: statusCode,
    error: error
  };
}

function sortByDate(a, b) {
  return a.applicationDate > b.applicationDate ? -1 : 1;
}

// Create application
module.exports.createApplication = async (event, context) => {
  const reqBody = JSON.parse(event.body);

  if (!reqBody.companyName || reqBody.companyName.trim() === "") {
    return failedResponse(400, {
      error: "Application must have a company name"
    });
  }

  const application = {
    id: uuid(),
    applicationDate: new Date().toISOString(),
    companyName: reqBody.companyName,
    howFar: reqBody.howFar,
    website: reqBody.website,
    position: reqBody.position,
    location: reqBody.location,
    response: reqBody.response,
    salary: reqBody.salary,
    status: reqBody.status
  };

  const params = {
    TableName: applicationsTable,
    Item: application
  };

  // TODO: return created object in body
  try {
    const data = await db.put(params).promise();
    return successfulResponse(200, data);
  } catch (error) {
    return failedResponse(400, error);
  }
};

// Get all applications
module.exports.getAllApplications = async (event, context) => {
  const params = {
    TableName: applicationsTable
  };

  try {
    const data = await db.scan(params).promise();
    const sortedData = data.Items.sort(sortByDate);
    return successfulResponse(200, sortedData);
  } catch (error) {
    return failedResponse(error.statusCode, error);
  }
};

// Get one application
module.exports.getApplication = async (event, context) => {
  const id = event.pathParameters.id;
  const params = {
    TableName: applicationsTable,
    Key: {
      id: id
    }
  };

  try {
    const data = await db.get(params).promise();

    if (data.Item) {
      return successfulResponse(200, data.Item);
    } else {
      return failedResponse(404, { error: "Application not found" });
    }
  } catch (error) {
    return failedResponse(error.statusCode, error);
  }
};

// TODO: update logic for updating application
// update application
module.exports.updateApplication = async (event, context) => {
  const id = event.pathParameters.id;
  const body = JSON.parse(event.body);

  const paramName = body.paramName;
  const paramValue = body.paramValue;

  const params = {
    TableName: applicationsTable,
    Key: {
      id: id
    },
    ConditionExpression: "attribute_exists(id)",
    UpdateExpression: "set " + paramName + " = :v",
    ExpressionAttributeValues: {
      ":v": paramValue
    },
    ReturnValues: "ALL_NEW"
  };

  try {
    const data = await db.update(params).promise();
    return successfulResponse(200, data);
  } catch (error) {
    return failedResponse(error.statusCode, error);
  }
};

// delete application
module.exports.deleteApplication = async (event, context) => {
  const id = event.pathParameters.id;

  const params = {
    TableName: applicationsTable,
    Key: {
      id: id
    }
  };

  // TODO: return deleted object in body
  try {
    const data = await db.delete(params).promise();
    return successfulResponse(200, data);
  } catch (error) {
    return failedResponse(error.statusCode, error);
  }
};
