const UrlHash = require("./url-hash")
class UrlHashStore {
    constructor(docClient) {
        this.docClient = docClient;
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
            .then( result => new UrlHash(result.Items[0]) );

    }

    // batch write the hashes to DynamoDb
    writeHashes(hashes) {
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