
const chai = require("chai");
const expect = chai.expect;

const td = require("testdouble");
const tdChai = require("testdouble-chai");
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
chai.use(tdChai(td));

const AWS = require("aws-sdk");
const UrlHash = require("../../url-hash/url-hash");
const UrlHashStore = require("../../url-hash/url-hash-store");

// AWS uses an API that in order to get a promise the promise() method is called
// on the Reponse obejct to send the message and return a Promise object.
//
// In order to stub these API functions simply do:
//    td.when(....).thenReturn( awsPromise(returnValue) )
function awsPromise(x) {
    return {
        promise() {
            return Promise.resolve({
                Items: [ x ]
            });
        }
    }
}

describe("UrlHashStore", function() {
    let hashes, docClient;
    beforeEach(function() {
        hashes = [
            new UrlHash("https://example.com/one", "content one", 1595834592740),
            new UrlHash("https://example.com/two", "content two", 1295834592740)
        ];
        const DocumentClientStub = td.constructor(AWS.DynamoDB.DocumentClient);
        docClient = new DocumentClientStub();
    });
    describe("getLatestHash()", function() {

        it("should call query() to return latest url", function() {
            const returnedHash = { 
                url: "https://example.com/one", 
                hash: "0f5f13cf0b14c88bd431ef163b63d68d", 
                timestamp:1495834592740 
            };
            const params = {
                TableName:"URL_HASH",
                KeyConditions: {
                    'url': {
                        ComparisonOperator: "EQ",
                        AttributeValueList: [ "https://example.com/one" ]
                    }
                },
                ScanIndexForward: false,
                Limit: 1
            };
            td.when( docClient.query(params) )
                .thenReturn( awsPromise(returnedHash) );
            const store = new UrlHashStore(docClient);
            return expect( store.getLatestHash(hashes[0]) )
                .to.eventually.deep.equal(new UrlHash(returnedHash) );
        });

    });

    describe("writeHashes()", function() {
        it("should call batchWrite() with each hash",function() {
            const params = {
                RequestItems: {
                    'URL_HASH': [{
                        PutRequest: {
                            Item: {
                                url: "https://example.com/one",
                                hash: "87960ed2f2ed3561189d212214602e40",
                                timestamp: 1595834592740
                            }
                        }
                    },
                    {
                        PutRequest: {
                            Item: {
                                url: "https://example.com/two",
                                hash: "1d8344c389c16608b4b6cc4c00946e59",
                                timestamp: 1295834592740
                            }
                        }
                    }]
                }
            };
            td.when( docClient.batchWrite(params) ).thenReturn(awsPromise());
            const store = new UrlHashStore(docClient);
            return expect( store.writeHashes(hashes) )
                .to.be.fulfilled
                .then(() => expect(docClient.batchWrite)
                    .to.have.been.called);
        });

        it("should NOT call batchWrite() with an empty set of hashes", function() {
            td.when(
                docClient.batchWrite(td.matchers.anything())
            ).thenReturn(awsPromise());
            const store = new UrlHashStore(docClient);
            return expect( store.writeHashes([]) )
                .to.be.fulfilled
                .then(() => expect(docClient.batchWrite)
                    .to.not.have.been.called);
            
        });
    });

})