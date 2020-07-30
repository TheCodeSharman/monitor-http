const AWS = require('aws-sdk');
module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      lambda_package: {
        default: {
            options: {
                // Task-specific options go here.
            }
        }
    },
    });
    grunt.loadNpmTasks('grunt-aws-lambda');
  
  };