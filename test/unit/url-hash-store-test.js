
const chai = require("chai");
const expect = chai.expect;

const td = require("testdouble");
const tdChai = require("testdouble-chai");
const chaiAsPromised = require("chai-as-promised");

const AWS = require("aws-sdk");
const UrlHash = require("../../url-hash/url-hash");
const UrlHashStore = require("../../url-hash/url-hash-store");

chai.use(chaiAsPromised);
chai.use(tdChai(td));




// AWS uses an API that in order to get a promise the promise() method is called
// on the Reponse obejct to send the message and return a Promise object.
//
// In order to stub these API functions simply do:
//    td.when(....).thenReturn( awsPromise(returnValue) )
function awsPromise(x) {
    return {
        promise() {
            return Promise.resolve(x);
        }
    }
}
function awsPromiseWithItems(x) {
    return {
        promise() {
            return Promise.resolve({
                Items: x
            });
        }
    }
}

describe("UrlHashStore", function() {
    let hashes, docClient, awsS3, store;
    beforeEach(function() {
        docClient = td.instance(AWS.DynamoDB.DocumentClient);
        awsS3= td.instance(AWS.S3);
        awsS3.getObject = td.function("getObject");
        hashes = [
            new UrlHash("https://example.com/one", Buffer.from("content one","utf8"), 1595834592740),
            new UrlHash("https://example.com/two", Buffer.from("content two","utf8"), 1295834592740)
        ];
        store = new UrlHashStore(docClient,awsS3);
    });
    describe("getLatestHash()", function() {

        it("should call query() to return latest url", function() {
            const returnedHash = { 
                url: "https://example.com/one", 
                hash: "0f5f13cf0b14c88bd431ef163b63d68d", 
                content: Buffer.from("content one","utf8"),
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
                .thenReturn( awsPromiseWithItems([returnedHash]) );
            td.when( awsS3.getObject({
                    Bucket: "stt.file.history",
                    Key: "https://example.com/one"
                })).thenReturn(awsPromise({
                    Body: Buffer.from("content one","utf8")
                }));

            return expect( store.getLatestHash(hashes[0]) )
                .to.eventually.deep.equal(new UrlHash(returnedHash) );
        });

        it("should return undefined if there is no latest URL", function() {
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
                .thenReturn( awsPromiseWithItems([]) );
            return expect( store.getLatestHash(hashes[0]) )
                .to.eventually.be.undefined;
        });

    });

    describe("writeHashes()", function() {
        it("should call S3.upload with each hash", function() {
            td.when( docClient.batchWrite(td.matchers.anything()) )
                .thenReturn(awsPromise());
            td.when( awsS3.upload(td.matchers.anything()))
                .thenReturn(awsPromise());
            return expect( store.writeHashes(hashes) )
                .to.be.fulfilled
                .then(() => {
                    expect(awsS3.upload)
                        .to.have.been.calledWith({
                            ACL: "private",
                            Bucket: "stt.file.history",
                            Key: "https://example.com/one",
                            Body: Buffer.from("content one","utf8")
                        });
                    expect(awsS3.upload)
                        .to.have.been.calledWith({
                            ACL: "private",
                            Bucket: "stt.file.history",
                            Key: "https://example.com/two",
                            Body: Buffer.from("content two","utf8")
                        });

                });
        });
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
            td.when( awsS3.upload(td.matchers.anything()))
                .thenReturn(awsPromise());
            return expect( store.writeHashes(hashes) )
                .to.be.fulfilled
                .then(() => expect(docClient.batchWrite)
                    .to.have.been.called);
        });

        it("should NOT call batchWrite() with an empty set of hashes", function() {
            td.when(
                docClient.batchWrite(td.matchers.anything())
            ).thenReturn(awsPromise());
            return expect( store.writeHashes([]) )
                .to.be.fulfilled
                .then(() => expect(docClient.batchWrite)
                    .to.not.have.been.called);
            
        });
    });

})