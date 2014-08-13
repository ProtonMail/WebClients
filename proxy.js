var http = require('http'),
    httpProxy = require('http-proxy');

//
// Create a proxy server with custom application logic
//
var proxy = httpProxy.createProxyServer({});

//
// Create your custom server and just call `proxy.web()` to proxy
// a web request to the target passed in the options
// also you can use `proxy.ws()` to proxy a websockets request
//
var server = require('http').createServer(function(req, res) {
  // You can define here your custom logic to handle the request
  // and then proxy the request.
  var cmps = req.url.split("?")[0].split("/");
  if (cmps[1] === "auth" || cmps[1] == "messages" || cmps[1] == "contacts" || cmps[1] == "users") {
    proxy.web(req, res, { target: 'http://54.187.1.221:8080' });
  } else {
    proxy.web(req, res, { target: 'http://127.0.0.1:4002' });
  }
});

server.listen(8080);
