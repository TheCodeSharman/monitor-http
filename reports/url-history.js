const AWS = require("aws-sdk");
const path = require("path");
const fs = require("fs");
const moment = require("moment");

const Configuration = JSON.parse( fs.readFileSync(path.join(__dirname,"../configuration.json") ) );
const AwsCredentials = new AWS.Credentials(Configuration.aws);
const UrlHashStore = require("../url-hash/url-hash-store");

const docClient = new AWS.DynamoDB.DocumentClient({
    apiVersion: '2012-08-10',
    credentials: AwsCredentials,
    region: Configuration.aws.region
});
const s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    credentials: AwsCredentials,
    region: Configuration.aws.region
});
const hashStore = new UrlHashStore(Configuration, docClient, s3);

async function reportHashHistory( hashes ) {
    const HtmlDiffer = require('html-differ').HtmlDiffer;
    const logger = require('html-differ/lib/logger');
    const htmlDiffer = new HtmlDiffer({
        ignoreAttributes: [],
        compareAttributesAsJSON: [],
        ignoreWhitespaces: true,
        ignoreComments: true,
        ignoreEndTags: false,
        ignoreDuplicateAttributes: false
    });
    let prev;
    async function asyncForEach(array, callback) {
        for (let index = 0; index < array.length; index++) {
          await callback(array[index], index, array);
        }
    }

    await asyncForEach( hashes, async h =>  {
        h = await hashStore.retrieveContent( h );

        if ( prev ) {
            let diff = htmlDiffer.diffHtml(prev.content.toString('utf8'),h.content.toString('utf8'));
            console.log(`${moment(h.timestamp).format("HH:mm DD/MMM/YYYY")}:\n$`);
            logger.logDiffText(diff, { charsAroundDiff: 40 });
           /* diff.forEach(d => {
                if ( d.added ) {
                    console.log(`added: ${d.value}`);
                } if ( d.removed ) {
                    console.log(`removed: ${d.value}`);
                } else {
                    let value = d.value;
                    if ( value.length > 40 ) {
                        console.log(`${value.substr(0,40)}...${value.substr(value.length-40)}`);
                    } else {
                        console.log(value);
                    }
                }
            });*/
            
        }
        prev = h;
    })
}

// Retrieve all the hashes and list dates of change
/* hashStore.listHashes()
    .then( reportHashHistory ); */
hashStore.getHashHistory( 'https://www.sttas.com.au/forest-operations-management/interactive-map-viewer' )
 .then( reportHashHistory )