const UrlHash = require("./url-hash")

// Since we go over the storage byte limit on DynamoDB we
// need to store the content field elsewhere so here we
// store it to an S3 bucket.
function generateS3BucketKey( urlHash ) {
    return `${urlHash.timestamp}_${encodeURIComponent(urlHash.url)}`;
}

class UrlHashStore {
    constructor(config,docClient,s3) {
        this.config = config;
        this.docClient = docClient;
        this.s3 = s3;
    }

    // remove the content field after storing it
    storeContent(urlHash) {
        return this.s3.upload({
            ACL: "private",
            Bucket: this.config.aws.s3_bucket,
            Key: generateS3BucketKey(urlHash),
            Body: urlHash.content
        }).promise()
          .then(() => urlHash);
    }

    // retrieve the content field and add it to the JSON
    retrieveContent(hashJSON) {
        return this.s3.getObject({
                Bucket: this.config.aws.s3_bucket,
                Key: generateS3BucketKey(hashJSON)
            }).promise()
              .then( data => {
                    hashJSON.content=data.Body
                    return hashJSON;
              })
              .catch(error =>{
                    if ( error.code === "NoSuchKey" ) {
                        return hashJSON;
                    } else {
                        throw error;
                    }
              });
    }

    // returns the latest hash for the given url
    getLatestHash(hash) {
        return this.docClient
            .query({
                TableName: this.config.aws.dynamodb_table,
                KeyConditions: {
                    'url': {
                        ComparisonOperator: "EQ",
                        AttributeValueList: [ hash.url ]
                    }
                },
                ScanIndexForward: false,
                Limit: 1})
            .promise()
            .then( result => {
                if ( result.Items.length >= 1 )
                    return this.retrieveContent(result.Items[0])
                        .then( h => new UrlHash(h) )
            });

    }

    // batch write the hashes to DynamoDb
    writeHashes(hashes) {
        if ( hashes.length === 0 ) {
            console.info('No changes detected.');
            return Promise.resolve();
        }
        console.info(`Recording changed URLs ${hashes.map(h=>`"${h.url}"`).join(", ")}.`)
        let that = this;
        
        function stripContentJson(h) {
            let json = h.toJSON();
            delete json.content; 
            return json;
        }
        function buildWriteRequest(hs) {
            const rq = {
                RequestItems: {
                }
            }
            rq.RequestItems[that.config.aws.dynamodb_table] =
                hs.map( h => { 
                    return {
                        PutRequest: {
                            Item: h
                        }
                    }
                });
            return rq;

        }
        return Promise.all( 
                hashes.map( h => 
                    this.storeContent( h )
                        .then( stripContentJson ) )
            ).then( hs => {
                this.docClient
                    .batchWrite(buildWriteRequest(hs))
                    .promise() 
            });
    }
}
module.exports = UrlHashStore;