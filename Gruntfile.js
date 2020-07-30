const AWS = require("aws-sdk");
module.exports = function(grunt) {

    // Project configuration.
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
                // Task-specific options go here.
            }
        },
      lambda_deploy: {
        default: {
            arn: 'arn:aws:lambda:us-east-1:123456781234:function:my-function',
            options: {
                // Task-specific options go here.
            }
        }
      }
    },
    });
    grunt.loadNpmTasks("grunt-aws-lambda");
    grunt.registerTask("default", ["lambda_package","lambda_deploy"]);
  };