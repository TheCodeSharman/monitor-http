const UrlHash = require("./url-hash")

// Since we go over the storage byte limit on DynamoDB we
// need to store the content field elsewhere so here we
// store it to an S3 bucket.
const S3_BUCKET = "stt.file.history";

class UrlHashStore {
    constructor(docClient,s3) {
        this.docClient = docClient;
        this.s3 = s3;
    }

    // remove the content field after storing it
    storeContent(urlHash) {
        return this.s3.upload({
            ACL: "private",
            Bucket: "stt.file.history",
            Key: urlHash.url,
            Body: urlHash.content
        }).promise()
          .then(() => urlHash);
    }

    // retrieve the content field and add it to the JSON
    retrieveContent(hashJSON) {
        return this.s3.getObject({
                Bucket: S3_BUCKET,
                Key: hashJSON.url
            }).promise()
              .then( data => {
                    hashJSON.content=data.Body
                    return hashJSON;
              });
    }

    // returns the latest hash for the given url
    getLatestHash(hash) {
        return this.docClient
            .query({
                TableName: "URL_HASH",
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
        if ( hashes.length === 0 ) return Promise.resolve();
        function stripContentJson(h) {
            let json = h.toJSON();
            delete json.content; 
            return json;
        }
        return Promise.all( 
                hashes.map( h => 
                    this.storeContent( h )
                        .then( stripContentJson ) )
            ).then( hs => 
                this.docClient
                    .batchWrite({
                        RequestItems: {
                            'URL_HASH': hs.map( h => { 
                                return {
                                    PutRequest: {
                                        Item: h
                                    }
                                }})
                        }
                    }).promise() );
    }
}
module.exports = UrlHashStore;