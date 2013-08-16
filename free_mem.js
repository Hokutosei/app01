var sys = require('sys')

var exec = require('child_process').exec;

function puts(error, stdout, stderr) { sys.puts(stdout) }

//exec("ls -la", puts);

var free_m = function() {
    var freeM = 'free -m | sed -n -e ' + '3p' + ' | grep -Po "\d+$"';
    exec(freeM, puts)
}

exec('free -m | sed -n -e "3p" | grep -Po "\d+$"', puts);