const chai = require("chai");
const expect = chai.expect;

const td = require("testdouble");
const tdChai = require("testdouble-chai");
const chaiAsPromised = require("chai-as-promised");
const UrlHash = require("../../url-hash/url-hash");

chai.use(chaiAsPromised);
chai.use(tdChai(td));

const fs = require("fs");
const path = require("path");

let monitor, retrieveUrlHash, UrlHashStore;
describe('monitor-http', function () {
  beforeEach( function() {
    retrieveUrlHash = td.replace("../../url-hash/url-hash-retriever");
    UrlHashStore = td.replace("../../url-hash/url-hash-store");
    monitor = require("../../index");
  });
  afterEach( function() {
    td.reset();
  });
  describe('index', function () {

    it('should retrieve urls and store differences', function (done) {
      const testEvent=JSON.parse(fs.readFileSync(path.join(__dirname,"test_event.json")));
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

      function callback(error,success) {
        if ( error ) {
          done(error);
        } else {
          expect( UrlHashStore.prototype.writeHashes )
            .to.have.been.calledWith( hashUrls.map( u => u.urlHashNew ) );
          done();
        }
      }

      monitor.handler(testEvent,context,callback);
      
    });

    it('should retrieve urls and store differences if the URL is new', function (done) {
      const testEvent=JSON.parse(fs.readFileSync(path.join(__dirname,"test_event.json")));
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
          td.when( retrieveUrlHash(urlHashNew.url) )
            .thenResolve( urlHashNew );
          td.when( UrlHashStore.prototype.getLatestHash(urlHashNew) )
            .thenResolve();
        }); 

      function callback(error,success) {
        if ( error ) {
          done(error);
        } else {
          expect( UrlHashStore.prototype.writeHashes )
            .to.have.been.calledWith( hashUrls.map( u => u.urlHashNew ) );
          done();
        }
      }

      monitor.handler(testEvent,context,callback);
      
    })
  });

  

});