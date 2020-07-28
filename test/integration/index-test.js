const chai = require("chai");
const expect = chai.expect;

const td = require("testdouble");
const tdChai = require("testdouble-chai");
const chaiAsPromised = require("chai-as-promised");
const UrlHash = require("../../src/url-hash");

chai.use(chaiAsPromised);
chai.use(tdChai(td));


let monitor, retrieveUrlHash, UrlHashStore;
describe('monitor-http', function () {
  beforeEach( function() {
    retrieveUrlHash = td.replace("../../src/url-hash-retriever");
    UrlHashStore = td.replace("../../src/url-hash-store");
    monitor = require("../../src/index");
  });
  afterEach( function() {
    td.reset();
  });
  describe('index', function () {

    it('should retrieve urls and store differences', function (done) {
      const testEvent={
          "id": "cdc73f9d-aea9-11e3-9d5a-835b769c0d9c",
          "detail-type": "Scheduled Event",
          "source": "aws.events",
          "account": "123456789012",
          "time": "1970-01-01T00:00:00Z",
          "region": "us-east-1",
          "resources": [
            "arn:aws:events:us-east-1:123456789012:rule/ExampleRule"
          ],
          "detail": {}
        };
      const context = {};
      

      // Url's that need to be checked
      const hashUrls = [ "BA", "DE", "HU", "MU"].map( areaCode =>{
          return  { 
              areaCode: areaCode, 
              urlHashNew: new UrlHash(`https://dink-ftp.sttas.com.au/3yp_${areaCode}.kmz`, 
                    `content ${areaCode} new`, 1635834592740 )
          }
      });
      hashUrls
        .forEach( ({ areaCode, urlHashNew }) => {
          const urlHashOld = new UrlHash(urlHashNew.url, `content ${areaCode} old`, 1235834592740);
          td.when( retrieveUrlHash(urlHashNew.url) )
            .thenResolve( urlHashNew );
          td.when( UrlHashStore.prototype.getLatestHash(urlHashNew) )
            .thenResolve( urlHashOld );
        }); 

      // Stub out store with expectations
      td.when( UrlHashStore.prototype.writeHashes( hashUrls.map( u => u.urlHashNew ) ) )
        .thenResolve();

      function callback(error,success) {
        if ( error ) {
          done(error);
        } else {
          expect( UrlHashStore.prototype.writeHashes ).to.have.been.calledWith(
            hashUrls.map( u => u.urlHashNew ) 
          );
          done();
        }
      }

      monitor.handler(testEvent,context,callback);
      
    }).timeout(10000);
  });

});