var https = require('https'), http = require('http'), dataArray = {},
    port = 1337;

var serverStart = new Date(), counter = 0;

http.createServer(function(req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain'});
    res.end(JSON.stringify(dataArray))
}).listen(port, '127.0.0.1');

getData()

function getData() {
    https.get('https://hitobank-test.herokuapp.com/sessions/job_openings_count.json', function(response) {
        response.on('data', function(chunk) {
            dataArray['job_opening_count'] = chunk.toString();
            dataArray = {
                job_opening_count: chunk.toString(),
                serverStart: serverStart,
                counter: counter
            };
            console.log(dataArray);
            counter++;
            return dataArray
        })
    })
}

setInterval(function() { getData() }, 90000);


console.log('Server is listening to', port);