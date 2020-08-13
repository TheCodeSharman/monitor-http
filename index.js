const AWS = require("aws-sdk");
const path = require("path");
const fs = require("fs");

const Configuration = JSON.parse( fs.readFileSync(path.join(__dirname,"configuration.json") ) );
const AwsCredentials = new AWS.Credentials(Configuration.aws);

const UrlHashStore = require("./url-hash/url-hash-store");
const retrieveUrlHash = require("./url-hash/url-hash-retriever");
const diffUrlHashes = require("./url-hash/url-hash-diff");

function downloadUrlsAndStoreChanges( event, context, callback ) {
    const docClient = new AWS.DynamoDB.DocumentClient({
        apiVersion: '2012-08-10',
        credentials: AwsCredentials,
        region: Configuration.aws.region
    });
    const s3 = new AWS.S3({
        apiVersion: '2006-03-01',
        credentials: AwsCredentials,
        region: Configuration.aws.region
    });
    const hashStore = new UrlHashStore(Configuration, docClient, s3);
    Promise.all( 
        Configuration.urls.map( url => retrieveUrlHash(url) ) 
     ).then( (hashes) => 
        diffUrlHashes(hashStore,hashes)  )
      .then( () => callback(null, "Finished") )
      .catch( (error) => callback(error.stack) );
}

exports.handler = downloadUrlsAndStoreChanges;