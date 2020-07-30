const AWS = require("aws-sdk");
module.exports = function(grunt) {
    grunt.initConfig({
      pkg: grunt.file.readJSON("package.json"),
      lambda_invoke: {
        default: {
          options: {
              event: "test/integration/test_event.json"
          }
        }
      },
      lambda_package: {
        default: {
          options: {
              include_files: [ "configuration.json" ]
          }
        },
      },
      lambda_deploy: {
        default: {
          arn: 'arn:aws:lambda:us-east-1:509394332014:function:diff_sus_tas_web',
          options: {
              credentialsJSON: "deploy-configuration.json"
          }
        }
      }
    });
    grunt.loadNpmTasks("grunt-aws-lambda");
    grunt.registerTask("default", ["lambda_package","lambda_deploy"]);
  };