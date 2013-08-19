var sys = require('sys')
    , exec = require('child_process').exec
    , myUtils = require('.././utils')
    , log = function(str) { myUtils.log(str) };


var execution = 'start';

var virtualMachines = ['jeanepaul-redis3', 'freebsd-redis1', 'jeanepaul-node1', 'jeanepaul-redis1-vm1'
                        , 'johnpaul-vm1a', 'funward-git'];

//var virtualMachines = ['jeanepaul-redis3', 'jeanepaul-node1', 'jeanepaul-redis1-vm1'];


function puts(error, stdout, stderr) { sys.puts(stdout)};

(function loopThrough(i) {
    setTimeout(function() {
        log(virtualMachines[i - 1]);
        var x = 'virsh ' + execution + ' ' + virtualMachines[i - 1];
        exec(x.toString(), puts);
        if(--i) loopThrough(i);
    }, 3000)
})(virtualMachines.length)