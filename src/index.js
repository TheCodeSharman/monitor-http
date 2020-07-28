const AWS = require("aws-sdk");
const UrlHashStore = require("./url-hash-store");
const retrieveUrlHash = require("./url-hash-retriever");
const diffUrlHashes = require("./url-hash-diff");
const AREACODES = [ "BA", "DE", "HU", "MU"];

function sttUrl(areaCode) {
    return `https://dink-ftp.sttas.com.au/3yp_${areaCode}.kmz`;
}

exports.handler = (event, context, callback) => {
    const docClient = new AWS.DynamoDB.DocumentClient({
        apiVersion: '2012-08-10',
        credentials: new AWS.FileSystemCredentials(`${__dirname}/configuration.json`),
        region: "us-east-1"
    });
    const hashStore = new UrlHashStore(docClient);
    Promise.all( 
        AREACODES.map( code => retrieveUrlHash(sttUrl(code)) ) 
     ).then( (hashes) => diffUrlHashes(hashStore,hashes) )
      .then( () => callback(null, "Finished") )
      .catch( (error) => callback(error) );
};