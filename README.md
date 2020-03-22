# Serverless Offline

<p>
  <a href="https://www.serverless.com">
    <img src="http://public.serverless.com/badges/v3.svg">
  </a>
  <a href="https://www.npmjs.com/package/serverless-offline">
    <img src="https://img.shields.io/npm/v/serverless-offline.svg?style=flat-square">
  </a>
  <a href="https://travis-ci.com/dherault/serverless-offline">
    <img src="https://img.shields.io/travis/dherault/serverless-offline/master.svg?style=flat-square">
  </a>
  <img src="https://img.shields.io/node/v/serverless-offline.svg?style=flat-square">
  <a href="https://github.com/serverless/serverless">
    <img src="https://img.shields.io/npm/dependency-version/serverless-offline/peer/serverless.svg?style=flat-square">
  </a>
  <a href="https://github.com/prettier/prettier">
    <img src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square">
  </a>
  <img src="https://img.shields.io/npm/l/serverless-offline.svg?style=flat-square">
  <a href="#contributing">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square">
  </a>
</p>

This [Serverless](https://github.com/serverless/serverless) plugin emulates [AWS λ](https://aws.amazon.com/lambda) and [API Gateway](https://aws.amazon.com/api-gateway) on your local machine to speed up your development cycles.
To do so, it starts an HTTP server that handles the request's lifecycle like APIG does and invokes your handlers.

**Features:**

- [Node.js](https://nodejs.org), [Python](https://www.python.org), [Ruby](https://www.ruby-lang.org) <!-- and [Go](https://golang.org) --> λ runtimes.
- Velocity templates support.
- Lazy loading of your handler files.
- And more: integrations, authorizers, proxies, timeouts, responseParameters, HTTPS, CORS, etc...

## Documentation

- [Getting started](#getting-started)
- [Plugin options](#plugin-options)
- [Supported event sources](#supported-event-sources)
- [Usage with invoke](#usage-with-invoke)
- [Token authorizers](#token-authorizers)
- [Custom authorizers](#custom-authorizers)
- [Remote authorizers](#remote-authorizers)
- [Custom headers](#custom-headers)
- [Environment variables](#environment-variables)
- [AWS API Gateway features](#aws-api-gateway-features)
- [WebSocket](#websocket)
- [Usage with Webpack](#usage-with-webpack)
- [Velocity nuances](#velocity-nuances)
- [Debug process](#debug-process)
- [Scoped execution](#scoped-execution)
- [Simulation quality](#simulation-quality)
- [Credits and inspiration](#credits-and-inspiration)
- [License](#license)
- [Contributing](#contributing)

## Getting started

First, add Serverless Offline to your project:

`npm install serverless-offline --save-dev`

in your project root create a `serverless.yml` file add `serverless-offline` to the `plugins` section:

```yaml
service: my-service

plugins:
  - serverless-offline

# optional
custom:
  serverless-offline:
    port: 3000 # default

provider:
  runtime: nodejs12.x

functions:
  hello:
    events:
      - http: GET hello
    handler: handler.hello
```

create a handler file `handler.js`:

```js
'use strict'

const { stringify } = JSON

exports.hello = async function hello() {
  return {
    body: stringify({ foo: 'bar' }),
    statusCode: 200,
  }
}
```

In your project root run:

`serverless offline` or `sls offline`

your endpoint is ready at: [http://localhost:3000/hello](http://localhost:3000/hello).

Please note that:

- You'll need to restart the plugin if you modify your `serverless.yml` or any of the default velocity template files.
- When no Content-Type header is set on a request, API Gateway defaults to `application/json`, and so does the plugin.
  But if you send an `application/x-www-form-urlencoded` or a `multipart/form-data` body with an `application/json` (or no) Content-Type, API Gateway won't parse your data (you'll get the ugly raw as input), whereas the plugin will answer 400 (malformed JSON).
  Please consider explicitly setting your requests' Content-Type and using separate templates.

## Plugin options

Plugin options can be specified in the `custom` section under `serverless-offline` of the `serverless.yml` file. All options are optional.

```yaml
custom:
  serverless-offline:
    # Defines the API key value to be used for endpoints marked as 'private'.
    apiKey: 3nyo2cwqiuqw3 (default is a random generated hash)

    # Used as default Access-Control-Allow-Headers header value for responses.
    # Delimit multiple values with commas.
    corsAllowHeaders: 'accept,content-type,x-api-key' (default)

    # Used as default Access-Control-Allow-Origin header value for responses.
    # Delimit multiple values with commas.
    corsAllowOrigin: '*' (default)

    # When provided, the default Access-Control-Allow-Credentials header value
    # will be passed as 'false'.
    corsDisallowCredentials: true (default) | false

    # Used as additional Access-Control-Exposed-Headers header value for responses.
    # Delimit multiple values with commas.
    corsExposedHeaders: 'WWW-Authenticate,Server-Authorization' (default)

    # Used to disable cookie-validation on hapi.js-server
    disableCookieValidation: ...

    # Enforce secure cookies
    enforceSecureCookies: ...

    # Hide the stack trace on lambda failure.
    hideStackTraces: true | false (default)

    # Host name to listen on.
    host: localhost (default)

    # To enable HTTPS, specify directory (relative to your cwd, typically your project dir)
    # for both cert.pem and key.pem files
    httpsProtocol: ...

    # Lambda http port to listen on.
    lambdaPort: 3002 (default)

    # Turns off all authorizers
    noAuth: ...

    # Disables the timeout feature.
    noTimeout: true | false (default)

    # Http Port to listen on.
    port: 3000 (default)

    # Turns on logging of your lambda outputs in the terminal.
    printOutput: ...

    # Turns on loading of your HTTP proxy settings from serverless.yml
    resourceRoutes: ...

    # Run handlers in a child process
    useChildProcesses: true | false (default)

    # Uses worker threads for handlers. Requires node.js v11.7.0 or higher
    useWorkerThreads: true | false (default)

    # WebSocket port to listen on.
    websocketPort: 3001 (default)
```

Any of the plugin options can be passed as CLI options as well, for example:

`npx serverless offline --port 3000 --useWorkerThreads`

to list all the options for the plugin run:

`serverless offline --help`

Order of preference: options passed on the command line override serverless custom options.

## Supported event sources

`Serverless-Offline` currently supports the following [serverless events](https://serverless.com/framework/docs/providers/aws/events/):

- [http](#http-api-gateway) (API Gateway)
- [schedule](#schedule-cloudwatch) (Cloudwatch)
- [websocket](#websocket-api-gateway-websocket) (API Gateway WebSocket)

✅ supported <br/>
❌ unsupported <br/>
ℹ️ ignored <br/>

### http (API Gateway)

docs: https://serverless.com/framework/docs/providers/aws/events/apigateway/

#### supported definitions

_incomplete list: more supported and unsupported config items coming soon_

```yaml
functions:                     ✅
  hello:                       ✅
    events:                    ✅
      - http: GET hello        ✅
      - http:                  ✅
          cors: true           ✅
          integration: lambda  ✅
          method: GET          ✅
          path: hello          ✅
          private: true        ✅
    handler: handler.hello     ✅
```

### schedule (Cloudwatch)

docs: https://serverless.com/framework/docs/providers/aws/events/schedule/

#### supported definitions

```yaml
functions:                               ✅
  crawl:                                 ✅
    events:                              ✅
      - schedule: cron(0 12 * * ? *)     ❌
      - schedule: rate(1 hour)           ✅
      - schedule:                        ✅
          enabled: true                  ✅
          input:                         ✅
            key1: value1
            key2: value2
          inputPath: '$.stageVariables'  ❌
          inputTransformer:              ❌
            inputPathsMap:
              eventTime: '$.time'
            inputTemplate: '{"time": <eventTime>, "key1": "value1"}'
          rate: cron(0 12 * * ? *)       ❌
          rate: rate(10 minutes)         ✅
    handler: handler.crawl               ✅
```

### websocket (API Gateway WebSocket)

docs: https://serverless.com/framework/docs/providers/aws/events/websocket/

#### supported definitions

```yaml
functions:                       ✅
  connectHandler:                ✅
    events:                      ✅
      - websocket: $connect      ✅
      - websocket: $default      ✅
      - websocket: $disconnect   ✅
      - websocket: custom        ✅
      - websocket:               ✅
          authorizer: auth       ❌
          authorizer: arn:aws:lambda:us-east-1:1234567890:function:auth ❌
          authorizer:            ❌
            arn: arn:aws:lambda:us-east-1:1234567890:function:auth ❌
            name: auth           ❌
            identitySource:      ❌
              - 'route.request.header.Auth'
              - 'route.request.querystring.Auth'
          authorizer
          route: $connect        ✅
          route: $default        ✅
          route: $disconnect     ✅
          route: custom          ✅
    handler: handler.connect     ✅
```

## Usage with `invoke`

To use `Lambda.invoke` you need to set the lambda endpoint to the serverless-offline endpoint:

```js
const { Lambda } = require('aws-sdk')

const lambda = new Lambda({
  apiVersion: '2015-03-31',
  // endpoint needs to be set only if it deviates from the default, e.g. in a dev environment
  // process.env.SOME_VARIABLE could be set in e.g. serverless.yml for provider.environment or function.environment
  endpoint: process.env.SOME_VARIABLE
    ? 'http://localhost:3002'
    : 'https://lambda.us-east-1.amazonaws.com',
})
```

All your lambdas can then be invoked in a handler using

```js
exports.handler = async function () {
  const params = {
    // FunctionName is composed of: service name - stage - function name, e.g.
    FunctionName: 'myServiceName-dev-invokedHandler',
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify({ data: 'foo' }),
  }

  const response = await lambda.invoke(params).promise()
}
```

## Token authorizers

As defined in the [Serverless Documentation](https://serverless.com/framework/docs/providers/aws/events/apigateway/#setting-api-keys-for-your-rest-api) you can use API Keys as a simple authentication method.

Serverless-offline will emulate the behaviour of APIG and create a random token that's printed on the screen. With this token you can access your private methods adding `x-api-key: generatedToken` to your request header. All api keys will share the same token. To specify a custom token use the `--apiKey` cli option.

## Custom authorizers

Only [custom authorizers](https://aws.amazon.com/blogs/compute/introducing-custom-authorizers-in-amazon-api-gateway/) are supported. Custom authorizers are executed before a Lambda function is executed and return an Error or a Policy document.

The Custom authorizer is passed an `event` object as below:

```javascript
{
  "type": "TOKEN",
  "authorizationToken": "<Incoming bearer token>",
  "methodArn": "arn:aws:execute-api:<Region id>:<Account id>:<API id>/<Stage>/<Method>/<Resource path>"
}
```

The `methodArn` does not include the Account id or API id.

The plugin only supports retrieving Tokens from headers. You can configure the header as below:

```javascript
"authorizer": {
  "type": "TOKEN",
  "identitySource": "method.request.header.Authorization", // or method.request.header.SomeOtherHeader
  "authorizerResultTtlInSeconds": "0"
}
```

## Remote authorizers

You are able to mock the response from remote authorizers by setting the environmental variable `AUTHORIZER` before running `sls offline start`

Example:

> Unix: `export AUTHORIZER='{"principalId": "123"}'`

> Windows: `SET AUTHORIZER='{"principalId": "123"}'`

## Custom headers

You are able to use some custom headers in your request to gain more control over the requestContext object.

| Header                          | Event key                                                   |
| ------------------------------- | ----------------------------------------------------------- |
| cognito-identity-id             | event.requestContext.identity.cognitoIdentityId             |
| cognito-authentication-provider | event.requestContext.identity.cognitoAuthenticationProvider |

By doing this you are now able to change those values using a custom header. This can help you with easier authentication or retrieving the userId from a `cognitoAuthenticationProvider` value.

## Environment variables

You are able to use environment variables to customize identity params in event context.

| Environment Variable                | Event key                                                   |
| ----------------------------------- | ----------------------------------------------------------- |
| SLS_COGNITO_IDENTITY_POOL_ID        | event.requestContext.identity.cognitoIdentityPoolId         |
| SLS_ACCOUNT_ID                      | event.requestContext.identity.accountId                     |
| SLS_COGNITO_IDENTITY_ID             | event.requestContext.identity.cognitoIdentityId             |
| SLS_CALLER                          | event.requestContext.identity.caller                        |
| SLS_API_KEY                         | event.requestContext.identity.apiKey                        |
| SLS_COGNITO_AUTHENTICATION_TYPE     | event.requestContext.identity.cognitoAuthenticationType     |
| SLS_COGNITO_AUTHENTICATION_PROVIDER | event.requestContext.identity.cognitoAuthenticationProvider |

You can use [serverless-dotenv-plugin](https://github.com/colynb/serverless-dotenv-plugin) to load environment variables from your `.env` file.

## AWS API Gateway Features

### Velocity Templates

[Serverless doc](https://serverless.com/framework/docs/providers/aws/events/apigateway#request-templates)
~ [AWS doc](http://docs.aws.amazon.com/apigateway/latest/developerguide/models-mappings.html#models-mappings-mappings)

You can supply response and request templates for each function. This is optional. To do so you will have to place function specific template files in the same directory as your function file and add the .req.vm extension to the template filename.
For example,
if your function is in code-file: `helloworld.js`,
your response template should be in file: `helloworld.res.vm` and your request template in file `helloworld.req.vm`.

### CORS

[Serverless doc](https://serverless.com/framework/docs/providers/aws/events/apigateway#enabling-cors)

If the endpoint config has CORS set to true, the plugin will use the CLI CORS options for the associated route.
Otherwise, no CORS headers will be added.

### Catch-all Path Variables

[AWS doc](https://aws.amazon.com/blogs/aws/api-gateway-update-new-features-simplify-api-development/)

Set greedy paths like `/store/{proxy+}` that will intercept requests made to `/store/list-products`, `/store/add-product`, etc...

### ANY method

[AWS doc](https://aws.amazon.com/blogs/aws/api-gateway-update-new-features-simplify-api-development/)

Works out of the box.

### Lambda and Lambda Proxy Integrations

[Serverless doc](https://serverless.com/framework/docs/providers/aws/events/apigateway#lambda-proxy-integration)
~ [AWS doc](http://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-create-api-as-simple-proxy-for-lambda.html)

Works out of the box. See examples in the manual_test directory.

### HTTP Proxy

[Serverless doc](https://serverless.com/framework/docs/providers/aws/events/apigateway#setting-an-http-proxy-on-api-gateway)
~
[AWS doc - AWS::ApiGateway::Method](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-apigateway-method.html)
~
[AWS doc - AWS::ApiGateway::Resource](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-apigateway-resource.html)

Example of enabling proxy:

```
custom:
  serverless-offline:
    resourceRoutes: true
```

or

```
    YourCloudFormationMethodId:
      Type: AWS::ApiGateway::Method
      Properties:
        ......
        Integration:
          Type: HTTP_PROXY
          Uri: 'https://s3-${self:custom.region}.amazonaws.com/${self:custom.yourBucketName}/{proxy}'
          ......
```

```
custom:
  serverless-offline:
    resourceRoutes:
      YourCloudFormationMethodId:
        Uri: 'http://localhost:3001/assets/{proxy}'
```

### Response parameters

[AWS doc](http://docs.aws.amazon.com/apigateway/latest/developerguide/request-response-data-mappings.html#mapping-response-parameters)

You can set your response's headers using ResponseParameters.

May not work properly. Please PR. (Difficulty: hard?)

Example response velocity template:

```javascript
"responseParameters": {
  "method.response.header.X-Powered-By": "Serverless", // a string
  "method.response.header.Warning": "integration.response.body", // the whole response
  "method.response.header.Location": "integration.response.body.some.key" // a pseudo JSON-path
},
```

## WebSocket

Usage in order to send messages back to clients:

`POST http://localhost:3001/@connections/{connectionId}`

Or,

```js
const apiGatewayManagementApi = new AWS.ApiGatewayManagementApi({
  apiVersion: '2018-11-29',
  endpoint: 'http://localhost:3001',
});

apiGatewayManagementApi.postToConnection({
  ConnectionId: ...,
  Data: ...,
});
```

Where the `event` is received in the lambda handler function.

There's support for [websocketsApiRouteSelectionExpression](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api-selection-expressions.html) in it's basic form: `$request.body.x.y.z`, where the default value is `$request.body.action`.

Authorizers and wss:// are currently not supported.

## Usage with Webpack

Use [serverless-webpack](https://github.com/serverless-heaven/serverless-webpack) to compile and bundle your ES-next code

## Velocity nuances

Consider this requestTemplate for a POST endpoint:

```json
"application/json": {
  "payload": "$input.json('$')",
  "id_json": "$input.json('$.id')",
  "id_path": "$input.path('$').id"
}
```

Now let's make a request with this body: `{ "id": 1 }`

AWS parses the event as such:

```javascript
{
  "payload": {
    "id": 1
  },
  "id_json": 1,
  "id_path": "1" // Notice the string
}
```

Whereas Offline parses:

```javascript
{
  "payload": {
    "id": 1
  },
  "id_json": 1,
  "id_path": 1 // Notice the number
}
```

Accessing an attribute after using `$input.path` will return a string on AWS (expect strings like `"1"` or `"true"`) but not with Offline (`1` or `true`).
You may find other differences.

## Debug process

Serverless offline plugin will respond to the overall framework settings and output additional information to the console in debug mode. In order to do this you will have to set the `SLS_DEBUG` environmental variable. You can run the following in the command line to switch to debug mode execution.

> Unix: `export SLS_DEBUG=*`

> Windows: `SET SLS_DEBUG=*`

Interactive debugging is also possible for your project if you have installed the node-inspector module and chrome browser. You can then run the following command line inside your project's root.

Initial installation:
`npm install -g node-inspector`

For each debug run:
`node-debug sls offline`

The system will start in wait status. This will also automatically start the chrome browser and wait for you to set breakpoints for inspection. Set the breakpoints as needed and, then, click the play button for the debugging to continue.

Depending on the breakpoint, you may need to call the URL path for your function in seperate browser window for your serverless function to be run and made available for debugging.

## Resource permissions and AWS profile

Lambda functions assume an IAM role during execution: the framework creates this role and set all the permission provided in the `iamRoleStatements` section of `serverless.yml`.

However, serverless offline makes use of your local AWS profile credentials to run the lambda functions and that might result in a different set of permissions. By default, the aws-sdk would load credentials for you default AWS profile specified in your configuration file.

You can change this profile directly in the code or by setting proper environment variables. Setting the `AWS_PROFILE` environment variable before calling `serverless` offline to a different profile would effectively change the credentials, e.g.

`AWS_PROFILE=<profile> serverless offline`

## Scoped execution

Downstream plugins may tie into the `before:offline:start:end` hook to release resources when the server is shutting down.

## Simulation quality

This plugin simulates API Gateway for many practical purposes, good enough for development - but is not a perfect simulator.
Specifically, Lambda currently runs on Node.js v10.x and v12.x ([AWS Docs](https://docs.aws.amazon.com/lambda/latest/dg/current-supported-versions.html)), whereas _Offline_ runs on your own runtime where no memory limits are enforced.

## Usage with serverless-dynamodb-local and serverless-webpack plugin

Run `serverless offline start`. In comparison with `serverless offline`, the `start` command will fire an `init` and a `end` lifecycle hook which is needed for serverless-offline and serverless-dynamodb-local to switch off resources.

Add plugins to your `serverless.yml` file:

```yaml
plugins:
  - serverless-webpack
  - serverless-dynamodb-local
  - serverless-offline # serverless-offline needs to be last in the list
```

## License

MIT

## Contributing

Yes, thank you!
This plugin is community-driven, most of its features are from different authors.
Please update the docs and tests and add your name to the package.json file.
We try to follow [Airbnb's JavaScript Style Guide](https://github.com/airbnb/javascript).
