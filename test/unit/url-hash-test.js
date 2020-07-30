const chai = require("chai");
const expect = chai.expect;
const UrlHash = require("../../url-hash/url-hash");

describe("UrlHash", function() {

    it("should create a new UrlHash", function() {
      const hash = new UrlHash( "http://example.com", "<html>some content</html>", 1595834592740 );
      expect( hash.url ).to.equal("http://example.com");
      expect( hash.hash ).to.equal("0bb3cdb16a1d6bc6e2c4d7bb16a7589e");
      expect( hash.timestamp ).to.equal(1595834592740);
    });

    it("should create a new UrlHash from JSON object", function() {
      const hash = new UrlHash({
        url:"http://example.com", 
        hash: "0bb3cdb16a1d6bc6e2c4d7bb16a7589e", 
        timestamp: 1595834592740
      });
      expect( hash.url ).to.equal("http://example.com");
      expect( hash.hash ).to.equal("0bb3cdb16a1d6bc6e2c4d7bb16a7589e");
      expect( hash.timestamp ).to.equal(1595834592740);
    });

    describe("toJSON()",function() {
      it("should return all the persistent data properties", function() {
        const hashJson = {
          url:"http://example.com", 
          hash: "0bb3cdb16a1d6bc6e2c4d7bb16a7589e", 
          timestamp: 1595834592740
        };
        const json = new UrlHash(hashJson).toJSON();
        expect( json ).to.deep.equal(hashJson);
      });
    });

    describe("hasChanged()", function() {

      it("should indicate a change if the hashes differ", function() {
        const hashA = new UrlHash( "http://example.com", "<html>some content</html>", 1595834592740 );
        const hashB = new UrlHash( "http://example.com", "<html>some content updated</html>", 1595934592740 );
        expect( hashA.hasChanged(hashB) ).to.be.true;
        expect( hashB.hasChanged(hashA) ).to.be.true;
      });

      it("should NOT indicate a change if the url's are different", function() {
        const hashA = new UrlHash( "http://example.com/one", "<html>some content</html>", 1595834592740 );
        const hashB = new UrlHash( "http://example.com/two", "<html>some content updated</html>", 1595934592740 );
        expect( hashA.hasChanged(hashB) ).to.be.false;
        expect( hashB.hasChanged(hashA) ).to.be.false;
      });

      it("should NOT indicate a change if the content is the same", function() {
        const hashA = new UrlHash( "http://example.com", "<html>some content</html>", 1595834592740 );
        const hashB = new UrlHash( "http://example.com", "<html>some content</html>", 1595934592740 );
        expect( hashA.hasChanged(hashB) ).to.be.false;
        expect( hashB.hasChanged(hashA) ).to.be.false;
      });
    });

    describe("findChangedHashes", function() {

      it("should return empty set if there are no changes", function() {
        const newHashes = [];
        newHashes.push(new UrlHash( "http://example.com/one", "<html>some content one</html>", 1535834592740 ));
        newHashes.push(new UrlHash( "http://example.com/two", "<html>some content two</html>", 1595834596740 ));

        const oldHashes = [];
        oldHashes.push(new UrlHash( "http://example.com/one", "<html>some content one</html>", 1235834592740 ));
        oldHashes.push(new UrlHash( "http://example.com/two", "<html>some content two</html>", 1295834596740 ));

        const diff = UrlHash.findChangedHashes(newHashes,oldHashes);
        expect( diff ).to.be.an("array");
        expect( diff ).to.be.empty;
      });

      it("should return all hashes if there are no old hashes", function() {
        const newHashes = [];
        const hashA = new UrlHash( "http://example.com/one", "<html>some content one</html>", 1535834592740 );
        const hashB = new UrlHash( "http://example.com/two", "<html>some content two</html>", 1595834596740 );
        newHashes.push(hashA);
        newHashes.push(hashB);

        const oldHashes = [];
      
        const diff = UrlHash.findChangedHashes(newHashes,oldHashes);
        expect( diff ).to.be.an("array");
        expect( diff ).to.have.lengthOf(2);
        expect( diff ).to.have.members([hashB,hashA]);
      });

      it("should return any hashes that have changed", function() {
        const newHashes = [];
        const hashA = new UrlHash( "http://example.com/one", "<html>some content one updated</html>", 1535834592740 );
        const hashB = new UrlHash( "http://example.com/two", "<html>some content two</html>", 1595834596740 );
        newHashes.push(hashA);
        newHashes.push(hashB);

        const oldHashes = [];
        const hashA2 = new UrlHash( "http://example.com/one", "<html>some content one</html>", 1335834592740 );
        const hashB2 = new UrlHash( "http://example.com/two", "<html>some content two</html>", 1395834596740 );
        oldHashes.push(hashA2);
        oldHashes.push(hashB2);
      
        const diff = UrlHash.findChangedHashes(newHashes,oldHashes);
        expect( diff ).to.be.an("array");
        expect( diff ).to.have.lengthOf(1);
        expect( diff ).to.have.members([hashA]);
      });

    });

  });