const chai = require("chai");
const expect = chai.expect;

const td = require("testdouble");
const tdChai = require("testdouble-chai");
const chaiAsPromised = require("chai-as-promised");


chai.use(chaiAsPromised);
chai.use(tdChai(td));

const UrlHash = require("../../src/url-hash");
const UrlHashStore = require("../../src/url-hash-store");
const diffUrlHashes = require("../../src/url-hash-diff");

describe("diffUrlHashes", function() {
    it("should only update URL's that have changed", function() {
        const hashA = new UrlHash( "http://example.com/one", "<html>some content one updated</html>", 1535834592740 );
        const hashB = new UrlHash( "http://example.com/two", "<html>some content two</html>", 1595834596740 );
        const hashA2 = new UrlHash( "http://example.com/one", "<html>some content one</html>", 1335834592740 );
        const hashB2 = new UrlHash( "http://example.com/two", "<html>some content two</html>", 1395834596740 );
        
        const HashStore = td.constructor(UrlHashStore);

        td.when(HashStore.prototype.getLatestHash(hashA)).thenResolve(hashA2);
        td.when(HashStore.prototype.getLatestHash(hashB)).thenResolve(hashB2);

        td.when(HashStore.prototype.writeHashes(td.matchers.anything())).thenResolve();
  
        return expect( diffUrlHashes(new HashStore(),[hashA,hashB]) )
            .to.be.fulfilled.and.then((result)=>{
                expect(HashStore.prototype.writeHashes).to.be.calledWith( [ hashA ] );
            });

    });
});