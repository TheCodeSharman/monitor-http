const chai = require("chai");
const expect = chai.expect;

const td = require("testdouble");
const tdChai = require("testdouble-chai");
const chaiAsPromised = require("chai-as-promised");
const UrlHash = require("../../url-hash/url-hash");

chai.use(chaiAsPromised);
chai.use(tdChai(td));

let fetch, retrieveUrlHash, dateNowStub;
describe("retrieveUrlHash", function() {
    beforeEach( function() {
        fetch = td.replace("node-fetch");
        retrieveUrlHash = require("../../url-hash/url-hash-retriever");
        dateNowStub = td.function(Date.now);
        global.Date.now = dateNowStub;
    });
    afterEach( function() {
        td.reset();
    });
    it("should retrieve and hash URL", function() {
        const expectedUrlHash = new UrlHash("https://example.com/one", "content", 1795864592740);
        td.when( Date.now() ).thenReturn(expectedUrlHash.timestamp);
        td.when( fetch("https://example.com/one", td.matchers.anything()) )
            .thenResolve("content");
        expect( retrieveUrlHash(expectedUrlHash.url) )
            .to.be.fulfilled.and.then((result)=>{
                expect(result).deep.equal(expectedUrlHash);
                expect(fetch).to.be.called;
            });

    });
});