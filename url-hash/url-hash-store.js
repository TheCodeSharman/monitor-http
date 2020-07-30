const UrlHash = require("./url-hash")
class UrlHashStore {
    constructor(docClient) {
        this.docClient = docClient;
    }

    // returns the latest hash for the given url
    getLatestHash(hash) {
        console.log(`getLatestHash ${JSON.stringify(hash)}`);
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
                console.log(`found hash ${JSON.stringify(result)}`);
                if ( result.Items.length >= 1 )
                    return new UrlHash(result.Items[0]) 
            });

    }

    // batch write the hashes to DynamoDb
    writeHashes(hashes) {
        console.log(`writeHashes ${JSON.stringify(hashes)}`);
        if ( hashes.length === 0 ) return Promise.resolve();
        function putHash(hash) {
            return {
                PutRequest: {
                    Item: hash.toJSON()
                }
            }
        }
        return this.docClient
            .batchWrite({
                RequestItems: {
                    'URL_HASH': hashes.map( putHash )
                }
            }).promise();
    }
}
module.exports = UrlHashStore;